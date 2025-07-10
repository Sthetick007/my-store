require('dotenv').config();
const mongoose = require('mongoose');

console.log('Starting MongoDB test...');

async function simpleTest() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('MongoDB URI available:', !!uri);
    
    if (!uri) {
      console.log('❌ No MongoDB URI found');
      return;
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully');
    
    // Get database stats
    const admin = mongoose.connection.db.admin();
    const info = await admin.serverStatus();
    console.log('Server version:', info.version);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleTest();
