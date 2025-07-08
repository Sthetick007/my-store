import { Router } from "express";
import { storage } from "../storage";
import { isTelegramAuthenticated } from "../telegramAuth";

const router = Router();

// User products route
router.get('/products', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
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

export default router;
