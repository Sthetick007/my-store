import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  image_url: { type: String },
  stock: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IProduct>('Product', ProductSchema);
