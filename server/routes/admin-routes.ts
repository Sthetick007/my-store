import { Router } from "express";
import { storage } from "../storage";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { isAdminAuthenticated } from "../adminAuth";

const router = Router();

// Admin routes for users
router.get('/users', isAdminAuthenticated, async (req: any, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Admin stats
router.get('/stats', isAdminAuthenticated, async (req: any, res) => {
  try {
    const users = await storage.getAllUsers();
    const totalRevenue = await storage.getTotalRevenue();
    const pendingTransactions = await storage.getTransactions('', 'pending');
    
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
    const transactions = await storage.getTransactions('', '');
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching admin transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

router.post('/transactions/:id/approve', isAdminAuthenticated, async (req: any, res) => {
  try {
    const id = req.params.id;
    const transaction = await storage.updateTransactionStatus(id, 'completed');
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    // Add balance to user account after approval
    if (transaction.type === 'deposit') {
      const targetUser = await storage.getUser(transaction.userId);
      if (targetUser) {
        const currentBalance = targetUser.balance || 0;
        const newBalance = currentBalance + transaction.amount;
        await storage.updateUserBalance(transaction.userId, newBalance);
      }
    }
    
    res.json(transaction);
  } catch (error) {
    console.error("Error approving transaction:", error);
    res.status(500).json({ message: "Failed to approve transaction" });
  }
});

router.post('/transactions/:id/deny', isAdminAuthenticated, async (req: any, res) => {
  try {
    const id = req.params.id;
    const transaction = await storage.updateTransactionStatus(id, 'failed');
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error("Error denying transaction:", error);
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

export default router;
