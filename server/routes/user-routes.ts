import { Router } from "express";
import { storage } from "../storage";
import { isTelegramAuthenticated } from "../telegramAuth";
import { SentProduct } from "../models/SentProduct";

const router = Router();

// User products route
router.get('/products', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Fetch sent products for this user
    const sentProducts = await SentProduct.find({ 
      userId, 
      isActive: true 
    }).sort({ sentAt: -1 });
    
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
    
    res.json(productMessages);
  } catch (error) {
    console.error("Error fetching user products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

export default router;
