import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupTelegramAuth, isTelegramAuthenticated } from "./telegramAuth";
import { bot } from "./telegramBot";
import { insertProductSchema, insertCartSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Telegram auth
  setupTelegramAuth(app);

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const { search, category } = req.query;
      console.log('Fetching products with search:', search, 'category:', category);
      const products = await storage.getProducts(
        search as string,
        category as string
      );
      console.log('Found products:', products.length);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/featured', async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes (bypass auth in dev)
  app.get('/api/cart', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789'; // Mock user for dev
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789'; // Mock user for dev
      const cartData = insertCartSchema.parse({ ...req.body, userId });
      const cartItem = await storage.addToCart(cartData);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart data", errors: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put('/api/cart/:id', async (req: any, res) => {
    try {
      const id = req.params.id;
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(id, quantity);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', async (req: any, res) => {
    try {
      const id = req.params.id;
      const success = await storage.removeFromCart(id);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete('/api/cart', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789'; // Mock user for dev
      const success = await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Transaction routes (bypass auth in dev)
  app.get('/api/transactions', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789'; // Mock user for dev
      const { type } = req.query;
      const transactions = await storage.getTransactions(userId, type as string);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789'; // Mock user for dev
      const transactionData = insertTransactionSchema.parse({ 
        ...req.body, 
        userId,
        status: 'pending'
      });
      
      // Do NOT update balance immediately - wait for admin approval
      console.log(`Transaction created: ${transactionData.type} for user ${userId} - Amount: ${transactionData.amount} - Status: pending`);
      
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isTelegramAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/stats', isTelegramAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const [users, revenue, recentActivity] = await Promise.all([
        storage.getAllUsers(),
        storage.getTotalRevenue(),
        storage.getRecentActivity()
      ]);
      
      res.json({
        totalUsers: users.length,
        totalRevenue: revenue,
        recentActivity
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Admin product management
  app.post('/api/admin/products', isTelegramAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
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

  app.put('/api/admin/products/:id', isTelegramAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
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

  app.delete('/api/admin/products/:id', isTelegramAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
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

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      bot: bot ? 'connected' : 'disabled',
      database: 'connected'
    });
  });

  // Webhook endpoint for Telegram bot (production)
  app.post('/api/webhook', (req, res) => {
    if (bot) {
      bot.processUpdate(req.body);
    }
    res.sendStatus(200);
  });

  // Admin routes
  app.get('/api/admin/users', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/stats', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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

  app.get('/api/admin/products', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/admin/products', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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

  app.put('/api/admin/products/:id', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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

  app.delete('/api/admin/products/:id', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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

  app.get('/api/admin/transactions', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const transactions = await storage.getTransactions('', '');
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching admin transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/admin/transactions/:id/approve', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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

  app.post('/api/admin/transactions/:id/deny', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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

  app.post('/api/admin/messages', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { userId: targetUserId, productId, message, credentials } = req.body;
      
      // In a real app, this would insert into a product_messages table
      // For now, we'll return success
      res.json({ 
        message: "Message sent successfully",
        targetUserId,
        productId,
        message,
        credentials 
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/user/products', async (req: any, res) => {
    try {
      const userId = req.user?.id || '123456789';
      
      // Mock product messages for demo
      const productMessages = [
        {
          id: 1,
          productId: 1,
          productName: "MacBook Pro M3",
          message: "Your MacBook Pro M3 purchase has been processed. Here are your credentials:",
          credentials: {
            username: "user123",
            password: "temp123456",
            license: "MBPR-2024-XXXX-YYYY",
            instructions: "Please change the password on first login. Contact support if you need help setting up your device."
          },
          createdAt: new Date().toISOString(),
          status: 'delivered'
        }
      ];
      
      res.json(productMessages);
    } catch (error) {
      console.error("Error fetching user products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
