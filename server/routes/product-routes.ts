import { Router } from "express";
import { storage } from "../storage";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Public product routes
router.get('/', async (req, res) => {
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

router.get('/featured', async (req, res) => {
  try {
    const products = await storage.getFeaturedProducts();
    res.json(products);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ message: "Failed to fetch featured products" });
  }
});

router.get('/:id', async (req, res) => {
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

export default router;
