import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  balance: number;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  telegramId: { type: String, required: true, unique: true },
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  isAdmin: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
  loginCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
