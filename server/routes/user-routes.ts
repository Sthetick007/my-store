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

export default router;
