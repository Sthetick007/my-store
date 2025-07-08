import { Router } from "express";
import { storage } from "../storage";
import { insertCartSchema } from "@shared/schema";
import { z } from "zod";
import { isTelegramAuthenticated } from "../telegramAuth";

const router = Router();

// Cart routes (protected by auth)
router.get('/', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    console.log('Fetching cart for user:', userId);
    const cartItems = await storage.getCartItems(userId);
    console.log('Found cart items:', cartItems.length);
    res.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

router.post('/', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    console.log('Adding to cart for user:', userId, 'product:', req.body.productId);
    const cartData = insertCartSchema.parse({ ...req.body, userId });
    const cartItem = await storage.addToCart(cartData);
    console.log('Added item to cart:', cartItem);
    res.json(cartItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid cart data", errors: error.errors });
    }
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Failed to add to cart" });
  }
});

router.put('/:id', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const id = req.params.id;
    const { quantity } = req.body;
    console.log('Updating cart item:', id, 'quantity:', quantity);
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

router.delete('/:id', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const id = req.params.id;
    console.log('Removing item from cart:', id);
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

router.delete('/', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    console.log('Clearing cart for user:', userId);
    const success = await storage.clearCart(userId);
    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

export default router;
