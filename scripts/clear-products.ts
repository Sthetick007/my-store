import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../server/models/Product';

// Load environment variables
dotenv.config();

async function clearProducts() {
  try {
    // Connect directly using the MONGODB_URI
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-store';
    console.log('Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all existing products
    const result = await Product.deleteMany({});
    console.log(`Deleted ${result.deletedCount} products from database`);

    console.log('All demo products have been removed successfully!');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing products:', error);
    process.exit(1);
  }
}

clearProducts();
