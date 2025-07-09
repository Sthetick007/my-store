import mongoose from 'mongoose';

export interface IBalanceLog {
  _id?: string;
  userId: string;
  adminId?: string;
  adminEmail?: string;
  previousBalance: number;
  newBalance: number;
  changeAmount: number;
  reason: string;
  changeType: 'admin_direct' | 'transaction_approval' | 'transaction_denial' | 'admin_add' | 'admin_remove';
  createdAt: Date;
  metadata?: {
    transactionId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

const balanceLogSchema = new mongoose.Schema<IBalanceLog>({
  userId: { type: String, required: true, index: true },
  adminId: { type: String }, // ID of admin who made the change
  adminEmail: { type: String }, // Email/identifier of admin
  previousBalance: { type: Number, required: true },
  newBalance: { type: Number, required: true },
  changeAmount: { type: Number, required: true },
  reason: { type: String, required: true },
  changeType: { 
    type: String, 
    required: true,
    enum: ['admin_direct', 'transaction_approval', 'transaction_denial', 'admin_add', 'admin_remove']
  },
  createdAt: { type: Date, default: Date.now, index: true },
  metadata: {
    transactionId: String,
    ipAddress: String,
    userAgent: String
  }
});

// Index for efficient queries
balanceLogSchema.index({ userId: 1, createdAt: -1 });
balanceLogSchema.index({ adminId: 1, createdAt: -1 });
balanceLogSchema.index({ changeType: 1, createdAt: -1 });

const BalanceLog = mongoose.model<IBalanceLog>('BalanceLog', balanceLogSchema);

export default BalanceLog;
