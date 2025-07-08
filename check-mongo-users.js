const { MongoClient } = require('mongodb');

async function checkUsers() {
  const client = new MongoClient('mongodb+srv://admin:sZjtcwPOhB9bcBhB@cluster0.lkpqzzf.mongodb.net/telegram-store');
  
  try {
    await client.connect();
    const db = client.db('telegram-store');
    const users = await db.collection('users').find({}).toArray();
    
    console.log('MongoDB Users:');
    console.log(JSON.stringify(users, null, 2));
    
    console.log('\nTotal users in MongoDB:', users.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();
