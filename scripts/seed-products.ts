import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../server/models/Product';
import { connectDB } from '../server/db';

// Load environment variables
dotenv.config();

const sampleProducts = [
  {
    name: "Premium Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 299.99,
    category: "Electronics",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    stock: 50,
    featured: true
  },
  {
    name: "Smart Phone Case",
    description: "Protective case with wireless charging support",
    price: 29.99,
    category: "Accessories",
    image_url: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400",
    stock: 100,
    featured: false
  },
  {
    name: "Bluetooth Speaker",
    description: "Portable waterproof Bluetooth speaker",
    price: 79.99,
    category: "Electronics",
    image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
    stock: 25,
    featured: true
  },
  {
    name: "Coffee Mug",
    description: "Ceramic coffee mug with custom design",
    price: 15.99,
    category: "Home",
    image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
    stock: 75,
    featured: false
  },
  {
    name: "Gaming Mouse",
    description: "High-precision gaming mouse with RGB lighting",
    price: 59.99,
    category: "Electronics",
    image_url: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400",
    stock: 30,
    featured: true
  }
];

async function seedProducts() {
  try {
    // Connect directly using the MONGODB_URI
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-store';
    console.log('Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${products.length} sample products`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
