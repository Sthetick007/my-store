import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../server/models/Product';
import { SentProduct } from '../server/models/SentProduct';

// Load environment variables
dotenv.config();

async function clearProducts() {
  try {
    // Connect directly using the MONGODB_URI
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-store';
    console.log('Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find products that are referenced in SentProduct collection
    const sentProductIds = await SentProduct.distinct('productId');
    console.log(`Found ${sentProductIds.length} products referenced in SentProduct history`);
    
    // Get products referenced in SentProductLog
    // Using the raw model approach since we didn't directly import the model
    const SentProductLog = mongoose.model('SentProductLog');
    const logProductIds = await SentProductLog.distinct('productId');
    console.log(`Found ${logProductIds.length} products referenced in SentProductLog history`);
    
    // Get products referenced in Transactions that have product metadata
    const Transaction = mongoose.model('Transaction');
    const transactionProductIds = await Transaction.distinct('metadata.productId');
    console.log(`Found ${transactionProductIds.length} products referenced in Transaction history`);
    
    // Combine all used product IDs
    const allUsedProductIds = [...new Set([...sentProductIds, ...logProductIds, ...transactionProductIds])];
    console.log(`Total of ${allUsedProductIds.length} unique products are referenced in history`);

    // Delete only products that are not referenced in any history
    const result = await Product.deleteMany({ 
      _id: { $nin: allUsedProductIds } 
    });
    
    console.log(`Deleted ${result.deletedCount} products from database`);
    console.log(`Preserved ${allUsedProductIds.length} products that are referenced in transaction history`);

    console.log('Products cleanup completed successfully!');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing products:', error);
    process.exit(1);
  }
}

clearProducts();
