import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SentProduct } from './server/models/SentProduct';
import User from './server/models/User';
import Product from './server/models/Product';
import { storage } from './server/storage';

dotenv.config();

async function testFullFlow() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-store');
    console.log('✅ Connected to MongoDB');
    
    // 1. Check if we have any users
    console.log('\n=== STEP 1: Check Users ===');
    const users = await User.find({});
    console.log('Total users in DB:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      
      // Create a test user
      console.log('🔧 Creating test user...');
      const testUser = await storage.upsertUser({
        id: 'test-user-123',
        telegramId: '123456789',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      });
      console.log('✅ Created test user:', testUser);
    } else {
      users.forEach(user => {
        console.log(`📝 User: ${user.id} | TelegramId: ${user.telegramId} | Name: ${user.firstName} ${user.lastName}`);
      });
    }
    
    // 2. Check products
    console.log('\n=== STEP 2: Check Products ===');
    const products = await Product.find({});
    console.log('Total products in DB:', products.length);
    
    if (products.length === 0) {
      console.log('❌ No products found');
    } else {
      products.slice(0, 3).forEach(product => {
        console.log(`📦 Product: ${product.name} | ID: ${product._id} | Price: $${product.price}`);
      });
    }
    
    // 3. Check sent products
    console.log('\n=== STEP 3: Check Sent Products ===');
    const sentProducts = await SentProduct.find({});
    console.log('Total sent products:', sentProducts.length);
    
    sentProducts.forEach(product => {
      console.log(`🎁 Sent Product: ${product.productName} | UserId: ${product.userId} | Username: ${product.username}`);
    });
    
    // 4. Test the query that the frontend uses
    console.log('\n=== STEP 4: Test Frontend Query ===');
    const allUsers = await User.find({});
    for (const user of allUsers) {
      console.log(`🔍 Testing user: ${user.id}`);
      const userProducts = await SentProduct.find({ userId: user.id, isActive: true });
      console.log(`   Found ${userProducts.length} products for user ${user.id}`);
      
      if (userProducts.length > 0) {
        userProducts.forEach(product => {
          console.log(`   📱 Product: ${product.productName} | Sent: ${product.sentAt}`);
        });
      }
    }
    
    // 5. Test the API endpoint logic
    console.log('\n=== STEP 5: Test API Logic ===');
    if (allUsers.length > 0) {
      const testUser = allUsers[0];
      console.log(`🧪 Testing with user: ${testUser.id}`);
      
      // Simulate the API call
      const sentProductsForUser = await SentProduct.find({ 
        userId: testUser.id, 
        isActive: true 
      }).sort({ sentAt: -1 });
      
      console.log(`📊 API would return ${sentProductsForUser.length} products`);
      
      // Transform to match expected format (like in user-routes.ts)
      const productMessages = sentProductsForUser.map(product => ({
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
      
      console.log('📋 Formatted products for frontend:', JSON.stringify(productMessages, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testFullFlow();
