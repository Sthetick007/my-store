import { Router } from "express";
import { storage } from "../storage";
import { insertCartSchema } from "@shared/schema";
import { z } from "zod";
import { isTelegramAuthenticated } from "../telegramAuth";

const router = Router();

// Get cart items for user
router.get('/', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    console.log('📦 Fetching cart for user:', userId);
    const cartItems = await storage.getCartItems(userId);
    console.log('✅ Found cart items:', cartItems.length);
    
    res.json({ success: true, cartItems });
  } catch (error) {
    console.error("❌ Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
});

// Add item to cart
router.post('/', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    const { productId, quantity = 1 } = req.body;
    console.log('🛒 Adding to cart - User:', userId, 'Product:', productId, 'Quantity:', quantity);
    
    if (!productId) {
      console.log('❌ Product ID is missing');
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }
    
    // Validate cart data
    const cartData = insertCartSchema.parse({ 
      userId, 
      productId, 
      quantity: parseInt(quantity) 
    });
    
    console.log('✅ Cart data validated:', cartData);
    
    // Check if product exists
    console.log('🔍 Looking for product:', productId);
    const product = await storage.getProduct(productId);
    console.log('📦 Product found:', !!product);
    
    if (!product) {
      console.log('❌ Product not found in database');
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    console.log('✅ Product exists, adding to cart...');
    
    // Add to cart
    const cartItem = await storage.addToCart(cartData);
    console.log('✅ Added item to cart:', cartItem);
    
    res.json({ success: true, cartItem, message: "Item added to cart" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Validation error:", error.errors);
      return res.status(400).json({ success: false, message: "Invalid cart data", errors: error.errors });
    }
    console.error("❌ Error adding to cart:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
});

// Update cart item quantity
router.put('/:id', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    const id = req.params.id;
    const { quantity } = req.body;
    console.log('📝 Updating cart item:', id, 'quantity:', quantity);
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }
    
    const cartItem = await storage.updateCartItem(id, parseInt(quantity));
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }
    
    console.log('✅ Updated cart item:', cartItem);
    res.json({ success: true, cartItem, message: "Cart item updated" });
  } catch (error) {
    console.error("❌ Error updating cart item:", error);
    res.status(500).json({ success: false, message: "Failed to update cart item" });
  }
});

// Remove item from cart
router.delete('/:id', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    const id = req.params.id;
    console.log('🗑️ Removing item from cart:', id);
    
    const success = await storage.removeFromCart(id);
    if (!success) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }
    
    console.log('✅ Removed item from cart');
    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("❌ Error removing from cart:", error);
    res.status(500).json({ success: false, message: "Failed to remove from cart" });
  }
});

// Clear entire cart
router.delete('/', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    
    console.log('🧹 Clearing cart for user:', userId);
    const success = await storage.clearCart(userId);
    
    console.log('✅ Cart cleared');
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("❌ Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
});

export default router;
