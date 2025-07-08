import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/telegram-store';

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Please set DATABASE_URL or MONGODB_URI environment variable",
  );
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export { mongoose };