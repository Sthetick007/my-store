import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function testConnection() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log('Testing connection to MongoDB...');
    console.log('URI (masked):', MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(MONGODB_URI!, { 
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test a simple operation
    const adminDB = mongoose.connection.db.admin();
    const result = await adminDB.ping();
    console.log('✅ Ping successful:', result);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
