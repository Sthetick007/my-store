import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function fixCartIndex() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('telegram-store');
    const coll = db.collection('carts');

    console.log('Existing indexes before fix:');
    console.log(await coll.indexes());

    // Drop incorrect unique index on userId
    try {
      await coll.dropIndex('userId_1');
      console.log('Dropped index: userId_1');
    } catch (err: any) {
      console.warn('Could not drop index userId_1:', err.message);
    }

    console.log('Indexes after fix:');
    console.log(await coll.indexes());
  } catch (error) {
    console.error('Error fixing cart index:', error);
  } finally {
    await client.close();
  }
}

fixCartIndex();
