import { Router } from "express";
import { storage } from "../storage";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { isAdminAuthenticated } from "../adminAuth";
import Product from "../models/Product";

const router = Router();

// Admin routes for users
router.get('/users', isAdminAuthenticated, async (req: any, res) => {
  try {
    console.log('📋 Admin fetching users...');
    console.log('🔐 Admin auth payload:', req.admin);
    const users = await storage.getAllUsers();
    console.log('👥 Found users:', users.length);
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// Get single user by ID
router.get('/users/:id', isAdminAuthenticated, async (req: any, res) => {
  try {
    const userId = req.params.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

// Get single user by Telegram ID
router.get('/users/telegram/:telegramId', isAdminAuthenticated, async (req: any, res) => {
  try {
    const telegramId = req.params.telegramId;
    const user = await storage.getUserByTelegramId(telegramId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user by telegram ID:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

// Update user balance
router.put('/users/:id/balance', isAdminAuthenticated, async (req: any, res) => {
  try {
    const userId = req.params.id;
    const { balance, reason } = req.body;
    
    if (typeof balance !== 'number') {
      return res.status(400).json({ message: "Balance must be a number" });
    }
    
    const user = await storage.updateUserBalanceWithLogging(
      userId, 
      balance,
      reason || 'Admin direct balance update',
      'admin_direct',
      req.admin?.id,
      req.admin?.email,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log(`✅ Admin updated user ${userId} balance to ${balance}. Reason: ${reason}`);
    
    res.json({ message: "User balance updated successfully", user });
  } catch (error) {
    console.error("Error updating user balance:", error);
    res.status(500).json({ message: "Failed to update user balance" });
  }
});

// Add balance to user
router.post('/users/:id/add-balance', isAdminAuthenticated, async (req: any, res) => {
  try {
    const userId = req.params.id;
    const { amount, reason } = req.body;
    
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const newBalance = (user.balance || 0) + amount;
    
    const updatedUser = await storage.updateUserBalanceWithLogging(
      userId, 
      newBalance,
      reason || `Admin added balance: +$${amount}`,
      'admin_add',
      req.admin?.id,
      req.admin?.email,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    console.log(`✅ Admin added $${amount} to user ${userId}. New balance: ${newBalance}. Reason: ${reason}`);
    
    res.json({ message: "Balance added successfully", user: updatedUser });
  } catch (error) {
    console.error("Error adding balance:", error);
    res.status(500).json({ message: "Failed to add balance" });
  }
});

// Remove balance from user
router.post('/users/:id/remove-balance', isAdminAuthenticated, async (req: any, res) => {
  try {
    const userId = req.params.id;
    const { amount, reason } = req.body;
    
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const newBalance = Math.max(0, (user.balance || 0) - amount);
    
    const updatedUser = await storage.updateUserBalanceWithLogging(
      userId, 
      newBalance,
      reason || `Admin removed balance: -$${amount}`,
      'admin_remove',
      req.admin?.id,
      req.admin?.email,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    console.log(`✅ Admin removed $${amount} from user ${userId}. New balance: ${newBalance}. Reason: ${reason}`);
    
    res.json({ message: "Balance removed successfully", user: updatedUser });
  } catch (error) {
    console.error("Error removing balance:", error);
    res.status(500).json({ message: "Failed to remove balance" });
  }
});

// Admin stats
router.get('/stats', isAdminAuthenticated, async (req: any, res) => {
  try {
    const users = await storage.getAllUsers();
    // Count total products sent via admin panel
    const sentLogs = await storage.getSentProductLogs();
    const totalSales = sentLogs.length;
    const pendingTransactions = await storage.getPendingTransactions();
    
    res.json({
      totalUsers: users.length,
      totalSales,
      pendingTransactions: pendingTransactions.length,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// Admin product management
router.get('/products', isAdminAuthenticated, async (req: any, res) => {
  try {
    const products = await storage.getProducts();
    res.json(products);
  } catch (error) {
    console.error("Error fetching admin products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.post('/products', isAdminAuthenticated, async (req: any, res) => {
  try {
    const productData = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(productData);
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid product data", errors: error.errors });
    }
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Failed to create product" });
  }
});

router.put('/products/:id', isAdminAuthenticated, async (req: any, res) => {
  try {
    const id = req.params.id;
    const productData = insertProductSchema.partial().parse(req.body);
    const product = await storage.updateProduct(id, productData);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid product data", errors: error.errors });
    }
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
});

router.delete('/products/:id', isAdminAuthenticated, async (req: any, res) => {
  try {
    const id = req.params.id;
    const success = await storage.deleteProduct(id);
    
    if (!success) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// Admin transaction management
router.get('/transactions', isAdminAuthenticated, async (req: any, res) => {
  try {
    const status = req.query.status as string;
    console.log('📋 Admin fetching transactions with status:', status);
    
    let transactions;
    if (status === 'pending') {
      transactions = await storage.getPendingTransactions();
    } else {
      transactions = await storage.getTransactions('', status || '');
    }
    
    console.log('✅ Admin found transactions:', transactions.length);
    res.json({ success: true, transactions });
  } catch (error) {
    console.error("❌ Error fetching admin transactions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
});

router.post('/transactions/:id/approve', isAdminAuthenticated, async (req: any, res) => {
  try {
    const id = req.params.id;
    console.log('💚 Admin approving transaction:', id);
    const transaction = await storage.updateTransactionStatus(id, 'completed');
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    console.log('✅ Transaction approved:', transaction);
    
    // Add balance to user account after approval with logging
    if (transaction.type === 'deposit') {
      const targetUser = await storage.getUser(transaction.userId);
      if (targetUser) {
        const currentBalance = targetUser.balance || 0;
        const newBalance = currentBalance + transaction.amount;
        await storage.updateUserBalanceWithLogging(
          transaction.userId,
          newBalance,
          `Transaction approved: ${transaction.description || transaction.type} - $${transaction.amount}`,
          'transaction_approval',
          req.admin?.id,
          req.admin?.email,
          {
            transactionId: transaction.id,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        );
        console.log(`💰 Updated user ${transaction.userId} balance from ${currentBalance} to ${newBalance}`);
      }
    }
    
    res.json(transaction);
  } catch (error) {
    console.error("❌ Error approving transaction:", error);
    res.status(500).json({ message: "Failed to approve transaction" });
  }
});

router.post('/transactions/:id/deny', isAdminAuthenticated, async (req: any, res) => {
  try {
    const id = req.params.id;
    console.log('❌ Admin denying transaction:', id);
    const transaction = await storage.updateTransactionStatus(id, 'failed');
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    console.log('🚫 Transaction denied:', transaction);
    
    // Log the denial
    if (transaction.type === 'deposit') {
      await storage.logBalanceChange({
        userId: transaction.userId,
        adminId: req.admin?.id,
        adminEmail: req.admin?.email,
        previousBalance: 0, // No balance change on denial
        newBalance: 0,
        reason: `Transaction denied: ${transaction.description || transaction.type} - $${transaction.amount}`,
        changeType: 'transaction_denial',
        metadata: {
          transactionId: transaction.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error("❌ Error denying transaction:", error);
    res.status(500).json({ message: "Failed to deny transaction" });
  }
});

// Send product to user
router.post('/send-product', isAdminAuthenticated, async (req: any, res) => {
  try {
    console.log('📦 Admin sending product with data:', req.body);
    const { telegramId, productId, username, password, instructions } = req.body;
    
    // Validate required fields
    if (!telegramId || !productId || !username || !password) {
      console.log('❌ Missing required fields:', { telegramId, productId, username, password });
      return res.status(400).json({ 
        message: "Missing required fields", 
        required: ["telegramId", "productId", "username", "password"],
        received: { telegramId, productId, username, password }
      });
    }
    
    // Get user by telegram ID first
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      console.log('❌ User not found with telegram ID:', telegramId);
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get product details
    console.log('🔍 Looking up product ID:', productId);
    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({ message: "Product not found" });
    }
    
    console.log('✅ Product found:', product.name);
    
    // Log the sent product
    await storage.logSentProduct({
      userId: user.id,
      userTelegramId: telegramId,
      userName: user.firstName || 'Unknown',
      productId,
      productName: product.name,
      username,
      password,
      instructions: instructions || '',
      adminId: req.admin?.id,
      adminEmail: req.admin?.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log('✅ Product sent successfully to user:', user.id);
    
    res.json({ 
      message: "Product sent successfully",
      sentProduct: {
        userId: user.id,
        productName: product.name,
        username,
        instructions: instructions || ''
      }
    });
  } catch (error) {
    console.error("❌ Error sending product:", error);
    res.status(500).json({ message: "Failed to send product" });
  }
});

// Get balance change logs
router.get('/balance-logs', isAdminAuthenticated, async (req: any, res) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    console.log('📊 Admin fetching balance logs...');
    const logs = await storage.getBalanceLogs(userId, limit);
    console.log('✅ Balance logs found:', logs.length);
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error("❌ Error fetching balance logs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch balance logs" });
  }
});

// Get sent product logs
router.get('/sent-product-logs', isAdminAuthenticated, async (req: any, res) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    console.log('📊 Admin fetching sent product logs...');
    const logs = await storage.getSentProductLogs(userId, limit);
    console.log('✅ Sent product logs found:', logs.length);
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error("❌ Error fetching sent product logs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sent product logs" });
  }
});

export default router;
