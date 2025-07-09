import mongoose from 'mongoose';
import User from './models/User';
import Product from './models/Product';
import Cart from './models/Cart';
import Transaction from './models/Transaction';
import BalanceLog from './models/BalanceLog';
import SentProductLog from './models/SentProductLog';
import type {
  User as UserType,
  UpsertUser,
  Product as ProductType,
  InsertProduct,
  Cart as CartType,
  InsertCart,
  Transaction as TransactionType,
  InsertTransaction,
} from "@shared/schema";

export interface IStorage {
  // User operations (for Telegram Auth)
  getUser(id: string): Promise<UserType | undefined>;
  upsertUser(user: UpsertUser): Promise<UserType>;
  getUserByTelegramId(telegramId: string): Promise<UserType | undefined>;
  updateUserBalance(userId: string, balance: number): Promise<UserType | undefined>;
  updateUserBalanceWithLogging(
    userId: string, 
    newBalance: number, 
    reason: string,
    changeType: 'admin_direct' | 'transaction_approval' | 'transaction_denial' | 'admin_add' | 'admin_remove',
    adminId?: string,
    adminEmail?: string,
    metadata?: { transactionId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<UserType | undefined>;
  
  // Product operations
  getProducts(search?: string, category?: string): Promise<ProductType[]>;
  getProduct(id: string): Promise<ProductType | undefined>;
  getFeaturedProducts(): Promise<ProductType[]>;
  createProduct(product: InsertProduct): Promise<ProductType>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<ProductType | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Cart operations
  getCartItems(userId: string): Promise<(CartType & { product: ProductType })[]>;
  addToCart(cartItem: InsertCart): Promise<CartType>;
  updateCartItem(id: string, quantity: number): Promise<CartType | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(userId: string, statusOrType?: string): Promise<TransactionType[]>;
  createTransaction(transaction: InsertTransaction): Promise<TransactionType>;
  updateTransactionStatus(id: string, status: string): Promise<TransactionType | undefined>;
  
  // Balance log operations
  logBalanceChange(log: {
    userId: string;
    adminId?: string;
    adminEmail?: string;
    previousBalance: number;
    newBalance: number;
    reason: string;
    changeType: 'admin_direct' | 'transaction_approval' | 'transaction_denial' | 'admin_add' | 'admin_remove';
    metadata?: {
      transactionId?: string;
      ipAddress?: string;
      userAgent?: string;
    };
  }): Promise<void>;
  getBalanceLogs(userId?: string, limit?: number): Promise<any[]>;
  
  // Sent product log operations
  logSentProduct(log: {
    userId: string;
    userTelegramId: string;
    userName: string;
    productId: string;
    productName: string;
    username: string;
    password: string;
    instructions: string;
    adminId?: string;
    adminEmail?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
  getSentProductLogs(userId?: string, limit?: number): Promise<any[]>;
  
  // Admin operations
  getAllUsers(): Promise<UserType[]>;
  getPendingTransactions(): Promise<TransactionType[]>;
  getTotalRevenue(): Promise<number>;
  getRecentActivity(): Promise<TransactionType[]>;
}

export class MongoStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<UserType | undefined> {
    const user = await User.findOne({ id });
    return user ? this.formatUser(user) : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    const user = await User.findOneAndUpdate(
      { telegramId: userData.telegramId },
      { 
        ...userData,
        $inc: { loginCount: 1 }
      },
      { upsert: true, new: true }
    );
    return this.formatUser(user);
  }

  async getUserByTelegramId(telegramId: string): Promise<UserType | undefined> {
    const user = await User.findOne({ telegramId });
    return user ? this.formatUser(user) : undefined;
  }

  async updateUserBalance(userId: string, balance: number): Promise<UserType | undefined> {
    const user = await User.findOneAndUpdate(
      { id: userId },
      { balance },
      { new: true }
    );
    return user ? this.formatUser(user) : undefined;
  }

  // Admin balance update with logging
  async updateUserBalanceWithLogging(
    userId: string, 
    newBalance: number, 
    reason: string,
    changeType: 'admin_direct' | 'transaction_approval' | 'transaction_denial' | 'admin_add' | 'admin_remove',
    adminId?: string,
    adminEmail?: string,
    metadata?: { transactionId?: string; ipAddress?: string; userAgent?: string }
  ): Promise<UserType | undefined> {
    // Get current balance first
    const currentUser = await this.getUser(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    const previousBalance = currentUser.balance || 0;
    
    // Update the balance
    const updatedUser = await this.updateUserBalance(userId, newBalance);
    
    if (updatedUser) {
      // Log the balance change
      await this.logBalanceChange({
        userId,
        adminId,
        adminEmail,
        previousBalance,
        newBalance,
        reason,
        changeType,
        metadata
      });
    }
    
    return updatedUser;
  }

  // Product operations
  async getProducts(search?: string, category?: string): Promise<ProductType[]> {
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    return products.map(this.formatProduct);
  }

  async getProduct(id: string): Promise<ProductType | undefined> {
    const product = await Product.findById(id);
    return product ? this.formatProduct(product) : undefined;
  }

  async getFeaturedProducts(): Promise<ProductType[]> {
    const products = await Product.find({ featured: true }).sort({ createdAt: -1 });
    return products.map(this.formatProduct);
  }

  async createProduct(productData: InsertProduct): Promise<ProductType> {
    const product = new Product(productData);
    await product.save();
    return this.formatProduct(product);
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<ProductType | undefined> {
    const product = await Product.findByIdAndUpdate(id, productData, { new: true });
    return product ? this.formatProduct(product) : undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await Product.findByIdAndDelete(id);
    return !!result;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartType & { product: ProductType })[]> {
    const cartItems = await Cart.find({ userId }).populate('productId');
    // Exclude any cart items whose product was deleted (populate gives null)
    const validItems = cartItems.filter((item: any) => item.productId);
    return validItems.map((item: any) => ({
      ...this.formatCart(item),
      product: this.formatProduct(item.productId as any)
    }));
  }

  async addToCart(cartData: InsertCart): Promise<CartType> {
    console.log('🛒 mongo-storage addToCart called with:', cartData);
    
    try {
      // Convert productId string to ObjectId
      const productObjectId = new mongoose.Types.ObjectId(cartData.productId);
      console.log('🔄 Converted productId to ObjectId:', productObjectId);
      
      const existingItem = await Cart.findOne({ 
        userId: cartData.userId, 
        productId: productObjectId 
      });

      if (existingItem) {
        console.log('📦 Found existing cart item, updating quantity');
        existingItem.quantity += cartData.quantity;
        await existingItem.save();
        return this.formatCart(existingItem);
      } else {
        console.log('➕ Creating new cart item');
        const cartItem = new Cart({
          ...cartData,
          productId: productObjectId
        });
        await cartItem.save();
        console.log('✅ Cart item created successfully');
        return this.formatCart(cartItem);
      }
    } catch (error) {
      console.error('❌ Error in addToCart:', error);
      throw error;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartType | undefined> {
    const cartItem = await Cart.findByIdAndUpdate(id, { quantity }, { new: true });
    return cartItem ? this.formatCart(cartItem) : undefined;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await Cart.findByIdAndDelete(id);
    return !!result;
  }

  async clearCart(userId: string): Promise<boolean> {
    await Cart.deleteMany({ userId });
    return true;
  }

  // Transaction operations
  async getTransactions(userId: string, statusOrType?: string): Promise<TransactionType[]> {
    const query: any = {};
    
    // Only filter by userId if it's provided (not empty)
    if (userId) {
      query.userId = userId;
    }
    
    // Check if the parameter is a status or type
    if (statusOrType) {
      const validStatuses = ['pending', 'completed', 'failed'];
      const validTypes = ['deposit', 'withdrawal', 'purchase', 'refund'];
      
      if (validStatuses.includes(statusOrType)) {
        query.status = statusOrType;
        console.log('🔍 Storage: Filtering by status:', statusOrType);
      } else if (validTypes.includes(statusOrType)) {
        query.type = statusOrType;
        console.log('🔍 Storage: Filtering by type:', statusOrType);
      }
    }

    console.log('🔍 Storage: Fetching transactions with query:', query);
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    console.log('📋 Storage: Found transactions:', transactions.length);
    console.log('📄 Storage: Transaction details:', transactions.map(t => ({
      id: t._id,
      userId: t.userId,
      type: t.type,
      amount: t.amount,
      status: t.status,
      metadata: t.metadata
    })));
    
    return transactions.map(this.formatTransaction);
  }

  async createTransaction(transactionData: InsertTransaction): Promise<TransactionType> {
    console.log('💾 Storage: Creating transaction:', transactionData);
    const transaction = new Transaction(transactionData);
    await transaction.save();
    console.log('✅ Storage: Transaction saved:', transaction);
    return this.formatTransaction(transaction);
  }

  async updateTransactionStatus(id: string, status: string): Promise<TransactionType | undefined> {
    console.log('🔄 Storage: Updating transaction status:', { id, status });
    const transaction = await Transaction.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true });
    console.log('✅ Storage: Transaction status updated:', transaction);
    return transaction ? this.formatTransaction(transaction) : undefined;
  }

  // Balance log operations
  async logBalanceChange(log: {
    userId: string;
    adminId?: string;
    adminEmail?: string;
    previousBalance: number;
    newBalance: number;
    reason: string;
    changeType: 'admin_direct' | 'transaction_approval' | 'transaction_denial' | 'admin_add' | 'admin_remove';
    metadata?: {
      transactionId?: string;
      ipAddress?: string;
      userAgent?: string;
    };
  }): Promise<void> {
    const changeAmount = log.newBalance - log.previousBalance;
    
    const balanceLog = new BalanceLog({
      userId: log.userId,
      adminId: log.adminId,
      adminEmail: log.adminEmail,
      previousBalance: log.previousBalance,
      newBalance: log.newBalance,
      changeAmount,
      reason: log.reason,
      changeType: log.changeType,
      metadata: log.metadata,
    });
    
    await balanceLog.save();
    
    console.log(`📊 Balance change logged: User ${log.userId}, ${changeAmount >= 0 ? '+' : ''}$${changeAmount} (${log.changeType})`);
  }

  async getBalanceLogs(userId?: string, limit: number = 50): Promise<any[]> {
    const query = userId ? { userId } : {};
    
    const logs = await BalanceLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName username telegramId')
      .lean();
    
    return logs.map(log => ({
      _id: log._id?.toString(),
      userId: log.userId,
      adminId: log.adminId,
      adminEmail: log.adminEmail,
      previousBalance: log.previousBalance,
      newBalance: log.newBalance,
      changeAmount: log.changeAmount,
      reason: log.reason,
      changeType: log.changeType,
      createdAt: log.createdAt,
      metadata: log.metadata,
    }));
  }

  // Sent product logging
  async logSentProduct(data: {
    userId: string;
    userTelegramId: string;
    userName: string;
    productId: string;
    productName: string;
    username: string;
    password: string;
    instructions: string;
    adminId?: string;
    adminEmail?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const sentProductLog = new SentProductLog({
      userId: data.userId,
      userTelegramId: data.userTelegramId,
      userName: data.userName,
      productId: data.productId,
      productName: data.productName,
      username: data.username,
      password: data.password,
      instructions: data.instructions,
      adminId: data.adminId || 'unknown',
      adminEmail: data.adminEmail || 'unknown',
      ipAddress: data.ipAddress || '',
      userAgent: data.userAgent || '',
      sentAt: new Date()
    });
    
    await sentProductLog.save();
    console.log(`📦 Product sent logged: User ${data.userId} received ${data.productName}`);
  }

  async getSentProductLogs(userId?: string, limit: number = 50): Promise<any[]> {
    const query: any = {};
    if (userId) {
      query.userId = userId;
    }
    
    const logs = await SentProductLog.find(query)
      .sort({ sentAt: -1 })
      .limit(limit)
      .lean();
    
    return logs.map(log => ({
      id: log._id.toString(),
      userId: log.userId,
      userTelegramId: log.userTelegramId,
      userName: log.userName,
      productId: log.productId,
      productName: log.productName,
      username: log.username,
      password: log.password,
      instructions: log.instructions,
      adminId: log.adminId,
      adminEmail: log.adminEmail,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      sentAt: log.sentAt
    }));
  }

  // Admin operations
  async getAllUsers(): Promise<UserType[]> {
    const users = await User.find({}).sort({ createdAt: -1 });
    return users.map(this.formatUser);
  }

  async getPendingTransactions(): Promise<TransactionType[]> {
    const transactions = await Transaction.find({ status: 'pending' }).sort({ createdAt: -1 });
    return transactions.map(this.formatTransaction);
  }

  async getTotalRevenue(): Promise<number> {
    const result = await Transaction.aggregate([
      { $match: { status: 'completed', type: 'deposit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getRecentActivity(): Promise<TransactionType[]> {
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(20);
    return transactions.map(this.formatTransaction);
  }

  private formatUser(user: any): UserType {
    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      balance: user.balance,
      loginCount: user.loginCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private formatProduct(product: any): ProductType {
    return {
      _id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image_url: product.image_url,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private formatCart(cart: any): CartType {
    // Handle both ObjectId and populated productId document
    const rawProductId = cart.productId;
    const productIdStr = rawProductId instanceof mongoose.Types.ObjectId
      ? rawProductId.toString()
      : rawProductId?._id?.toString() || '';
    return {
      _id: cart._id.toString(),
      userId: cart.userId,
      productId: productIdStr,
      quantity: cart.quantity,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private formatTransaction(transaction: any): TransactionType {
    return {
      id: transaction._id.toString(),
      _id: transaction._id.toString(),
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}

export const storage = new MongoStorage();
