import { MongoClient, ObjectId } from 'mongodb';

async function checkSpecificProduct() {
  const client = new MongoClient('mongodb+srv://admin:sZjtcwPOhB9bcBhB@cluster0.lkpqzzf.mongodb.net/telegram-store');
  
  try {
    await client.connect();
    const db = client.db('telegram-store');
    
    const productId = '686d40d4a2b941a656c2a22e';
    console.log('Looking for product ID:', productId);
    
    // Check if it exists as string
    const productByString = await db.collection('products').findOne({ _id: productId });
    console.log('Found by string ID:', !!productByString);
    
    // Check if it exists as ObjectId
    try {
      const productByObjectId = await db.collection('products').findOne({ _id: new ObjectId(productId) });
      console.log('Found by ObjectId:', !!productByObjectId);
      if (productByObjectId) {
        console.log('Product details:', productByObjectId);
      }
    } catch (e) {
      console.log('Invalid ObjectId format');
    }
    
    // List all products to see what we have
    console.log('\n=== ALL PRODUCTS ===');
    const products = await db.collection('products').find({}).toArray();
    console.log('Products count:', products.length);
    products.forEach(p => console.log('Product:', p._id, p.name, p.price, p.stock));
    
  } finally {
    await client.close();
  }
}

checkSpecificProduct().catch(console.error);
