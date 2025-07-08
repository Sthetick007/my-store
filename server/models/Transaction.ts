import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund';
  amount: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: String, required: true, ref: 'User' },
  type: { 
    type: String, 
    required: true, 
    enum: ['deposit', 'withdrawal', 'purchase', 'refund']
  },
  amount: { type: Number, required: true },
  description: { type: String },
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'completed', 'failed']
  },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
