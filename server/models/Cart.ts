import mongoose, { Schema, Document } from 'mongoose';

export interface ICart extends Document {
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema: Schema = new Schema({
  userId: { type: String, required: true, ref: 'User' },
  productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  quantity: { type: Number, required: true, default: 1 }
}, {
  timestamps: true
});

CartSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model<ICart>('Cart', CartSchema);
