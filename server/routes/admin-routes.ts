import { Router } from "express";
import { storage } from "../storage";
import { insertProductSchema, insertSentProductSchema } from "@shared/schema";
import { z } from "zod";
import { isAdminAuthenticated } from "../adminAuth";
import { SentProduct } from "../models/SentProduct";
import Product from "../models/Product";

const router = Router();

// Admin routes for users
router.get('/users', isAdminAuthenticated, async (req: any, res) => {
  try {
    console.log('📋 Admin fetching users...');
    console.log('🔐 Admin auth payload:', req.admin);
    const users = await storage.getAllUsers();
    console.log('👥 Found users:', users.length);
    console.log('📊 Users data:', users);
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
    
    const user = await storage.updateUserBalance(userId, balance);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Log the balance change (optional)
    console.log(`Admin updated user ${userId} balance to ${balance}. Reason: ${reason}`);
    
    res.json({ message: "User balance updated successfully", user });
  } catch (error) {
    console.error("Error updating user balance:", error);
    res.status(500).json({ message: "Failed to update user balance" });
  }
});

// Update user balance by telegram ID
router.put('/users/telegram/:telegramId/balance', isAdminAuthenticated, async (req: any, res) => {
  try {
    const telegramId = req.params.telegramId;
    const { balance, reason } = req.body;
    
    if (typeof balance !== 'number') {
      return res.status(400).json({ message: "Balance must be a number" });
    }
    
    // First get the user by telegram ID
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Then update the balance using the user ID
    const updatedUser = await storage.updateUserBalance(user.id, balance);
    
    if (!updatedUser) {
      return res.status(404).json({ message: "Failed to update user balance" });
    }
    
    // Log the balance change (optional)
    console.log(`Admin updated user ${telegramId} (${user.id}) balance to ${balance}. Reason: ${reason}`);
    
    res.json({ message: "User balance updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user balance:", error);
    res.status(500).json({ message: "Failed to update user balance" });
  }
});

// Admin stats
router.get('/stats', isAdminAuthenticated, async (req: any, res) => {
  try {
    const users = await storage.getAllUsers();
    const totalRevenue = await storage.getTotalRevenue();
    const pendingTransactions = await storage.getPendingTransactions();
    
    res.json({
      totalUsers: users.length,
      totalRevenue,
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
    console.log('📄 Admin transaction details:', transactions);
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
    
    // Add balance to user account after approval
    if (transaction.type === 'deposit') {
      const targetUser = await storage.getUser(transaction.userId);
      if (targetUser) {
        const currentBalance = targetUser.balance || 0;
        const newBalance = currentBalance + transaction.amount;
        await storage.updateUserBalance(transaction.userId, newBalance);
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
    
    res.json(transaction);
  } catch (error) {
    console.error("❌ Error denying transaction:", error);
    res.status(500).json({ message: "Failed to deny transaction" });
  }
});

// Admin messages
router.post('/messages', isAdminAuthenticated, async (req: any, res) => {
  try {
    const { userId: targetUserId, productId, message: userMessage, credentials } = req.body;
    
    // In a real app, this would insert into a product_messages table
    // For now, we'll return success
    res.json({ 
      message: "Message sent successfully",
      targetUserId,
      productId,
      userMessage,
      credentials 
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Send product to user
router.post('/send-product', isAdminAuthenticated, async (req: any, res) => {
  try {
    const { userId, productId, username, password, instructions } = req.body;
    
    // Validate required fields
    if (!userId || !productId || !username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Create sent product record
    const sentProduct = new SentProduct({
      userId,
      productId,
      productName: product.name,
      username,
      password,
      instructions: instructions || '',
      sentAt: new Date(),
      isActive: true,
    });
    
    await sentProduct.save();
    
    res.json({ 
      message: "Product sent successfully",
      sentProduct: {
        id: sentProduct._id,
        productName: product.name,
        username,
        instructions
      }
    });
  } catch (error) {
    console.error("Error sending product:", error);
    res.status(500).json({ message: "Failed to send product" });
  }
});

export default router;
