import { Router } from "express";
import { storage } from "../storage";
import { isTelegramAuthenticated } from "../telegramAuth";
import { SentProduct } from "../models/SentProduct";

const router = Router();

// User products route
router.get('/products', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    console.log('🔍 Fetching products for user:', userId);
    
    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Log all SentProducts to check if they exist
    console.log('📦 All SentProducts in DB:', await SentProduct.countDocuments());
    
    // Fetch sent products for this user
    const sentProducts = await SentProduct.find({ 
      userId, 
      isActive: true 
    }).sort({ sentAt: -1 });
    
    console.log(`✅ Found ${sentProducts.length} products for user ${userId}`);
    if (sentProducts.length > 0) {
      console.log('📦 Sample product:', JSON.stringify(sentProducts[0]));
    }
    
    // Transform to match expected format
    const productMessages = sentProducts.map(product => ({
      id: product._id,
      productId: product.productId,
      productName: product.productName,
      message: `Your ${product.productName} has been sent to you. Here are your credentials:`,
      credentials: {
        username: product.username,
        password: product.password,
        instructions: product.instructions || "Please use these credentials to access your product."
      },
      createdAt: product.sentAt || new Date().toISOString(),
      status: 'delivered'
    }));
    
    console.log(`✅ Returning ${productMessages.length} formatted products`);
    
    res.json(productMessages);
  } catch (error) {
    console.error("❌ Error fetching user products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Debug endpoint to check products for a specific user
router.get('/products/debug/:userId', async (req: any, res) => {
  try {
    const userId = req.params.userId;
    console.log('🔍 Debug: Fetching products for user ID:', userId);
    
    // Get all sent products
    const allProducts = await SentProduct.find().limit(20);
    console.log('📊 Debug: All products in DB:', allProducts.length);
    
    // Fetch sent products for this specific user
    const sentProducts = await SentProduct.find({ 
      userId, 
      isActive: true 
    }).sort({ sentAt: -1 });
    
    console.log(`✅ Debug: Found ${sentProducts.length} products for user ${userId}`);
    
    res.json({
      allProducts: allProducts.map(p => ({ 
        id: p._id, 
        userId: p.userId, 
        productName: p.productName 
      })),
      userProducts: sentProducts.map(p => ({ 
        id: p._id, 
        userId: p.userId, 
        productName: p.productName 
      }))
    });
  } catch (error) {
    console.error("❌ Debug error:", error);
    res.status(500).json({ message: "Debug error", error: String(error) });
  }
});

// Direct products route by ID (for easier access)
router.get('/products/by-id/:userId', async (req: any, res) => {
  try {
    const userId = req.params.userId;
    console.log('🔍 Fetching products directly for user ID:', userId);
    
    if (!userId) {
      console.log('❌ No user ID provided');
      return res.status(400).json({ message: "User ID required" });
    }
    
    // Fetch sent products for this user
    const sentProducts = await SentProduct.find({ 
      userId, 
      isActive: true 
    }).sort({ sentAt: -1 });
    
    console.log(`✅ Found ${sentProducts.length} products for user ${userId}`);
    if (sentProducts.length > 0) {
      console.log('📦 Sample product:', JSON.stringify(sentProducts[0]));
    }
    
    // Transform to match expected format
    const productMessages = sentProducts.map(product => ({
      id: product._id,
      productId: product.productId,
      productName: product.productName,
      message: `Your ${product.productName} has been sent to you. Here are your credentials:`,
      credentials: {
        username: product.username,
        password: product.password,
        instructions: product.instructions || "Please use these credentials to access your product."
      },
      createdAt: product.sentAt || new Date().toISOString(),
      status: 'delivered'
    }));
    
    console.log(`✅ Returning ${productMessages.length} formatted products`);
    
    res.json(productMessages);
  } catch (error) {
    console.error("❌ Error fetching user products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Get comprehensive user activity feed
router.get('/activity', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    console.log('📊 Fetching activity for user:', userId);
    
    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const activities: any[] = [];
    
    // Get transactions
    const transactions = await storage.getTransactions(userId);
    transactions.forEach(transaction => {
      activities.push({
        id: `tx_${transaction.id}`,
        type: 'transaction',
        subType: transaction.type,
        title: transaction.type === 'deposit' ? 'Balance Added' : 
               transaction.type === 'purchase' ? 'Product Purchase' : 
               transaction.type === 'withdrawal' ? 'Balance Withdrawn' : 'Transaction',
        description: transaction.description || `${transaction.type} of $${Math.abs(transaction.amount)}`,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
        icon: transaction.type === 'deposit' ? 'fa-plus-circle' :
              transaction.type === 'purchase' ? 'fa-shopping-bag' :
              transaction.type === 'withdrawal' ? 'fa-minus-circle' : 'fa-exchange-alt',
        color: transaction.type === 'deposit' ? 'green' :
               transaction.type === 'purchase' ? 'blue' :
               transaction.type === 'withdrawal' ? 'red' : 'gray'
      });
    });
    
    // Get sent products
    const sentProducts = await SentProduct.find({ 
      userId, 
      isActive: true 
    }).sort({ sentAt: -1 });
    
    sentProducts.forEach(product => {
      activities.push({
        id: `product_${product._id}`,
        type: 'product_received',
        subType: 'sent_product',
        title: 'Product Received',
        description: `You received ${product.productName}`,
        productName: product.productName,
        username: product.username,
        status: 'delivered',
        createdAt: product.sentAt,
        icon: 'fa-gift',
        color: 'purple'
      });
    });

    // Get balance changes (admin actions)
    try {
      const balanceLogs = await storage.getBalanceLogs(userId, 10);
      balanceLogs.forEach(log => {
        // Only show admin-initiated balance changes, not transaction-related ones
        if (log.changeType === 'admin_direct' || log.changeType === 'admin_add' || log.changeType === 'admin_remove') {
          const balanceChange = log.newBalance - log.previousBalance;
          activities.push({
            id: `balance_${log._id}`,
            type: 'balance_change',
            subType: log.changeType,
            title: balanceChange > 0 ? 'Balance Added' : 'Balance Adjusted',
            description: log.reason || `Admin ${balanceChange > 0 ? 'added' : 'adjusted'} your balance`,
            amount: balanceChange,
            status: 'completed',
            createdAt: log.createdAt,
            icon: balanceChange > 0 ? 'fa-coins' : 'fa-edit',
            color: balanceChange > 0 ? 'green' : 'yellow'
          });
        }
      });
    } catch (error) {
      console.log('Note: Could not fetch balance logs:', (error as Error).message);
    }
    
    // Sort activities by date (newest first)
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Limit to last 20 activities
    const recentActivities = activities.slice(0, 20);
    
    console.log(`✅ Returning ${recentActivities.length} activities for user ${userId}`);
    
    res.json({
      success: true,
      activities: recentActivities,
      total: activities.length
    });
  } catch (error) {
    console.error("❌ Error fetching user activity:", error);
    res.status(500).json({ message: "Failed to fetch activity" });
  }
});

export default router;
