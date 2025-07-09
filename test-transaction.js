import { MongoClient } from 'mongodb';

async function createTestTransaction() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/telegram-store');
  
  try {
    await client.connect();
    const db = client.db();
    
    const transaction = {
      userId: '123456789',
      type: 'deposit',
      amount: 100,
      description: 'Test deposit via UPI',
      status: 'pending',
      metadata: {
        paymentMethod: 'upi',
        orderId: 'TEST123456',
        timestamp: new Date().toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('transactions').insertOne(transaction);
    console.log('Test transaction created:', result.insertedId);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createTestTransaction();
