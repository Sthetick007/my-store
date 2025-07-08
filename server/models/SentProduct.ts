import mongoose from 'mongoose';

const sentProductSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  instructions: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

export const SentProduct = mongoose.model('SentProduct', sentProductSchema);
