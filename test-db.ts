import { connectDB } from './server/db';

console.log('Starting MongoDB connection test...');

connectDB()
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });
