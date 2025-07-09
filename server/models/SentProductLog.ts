import mongoose from 'mongoose';

const sentProductLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userTelegramId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  adminId: {
    type: String,
    required: true
  },
  adminEmail: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for querying by user and date
sentProductLogSchema.index({ userId: 1, sentAt: -1 });
sentProductLogSchema.index({ sentAt: -1 }); // For general admin queries

const SentProductLog = mongoose.model('SentProductLog', sentProductLogSchema);

export default SentProductLog;
