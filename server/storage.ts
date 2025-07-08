import {
  users,
  products,
  carts,
  transactions,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Cart,
  type InsertCart,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  updateUserBalance(userId: string, balance: string): Promise<User | undefined>;
  
  // Product operations
  getProducts(search?: string, category?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Cart operations
  getCartItems(userId: string): Promise<(Cart & { product: Product })[]>;
  addToCart(cartItem: InsertCart): Promise<Cart>;
  updateCartItem(id: number, quantity: number): Promise<Cart | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(userId: string, type?: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getTotalRevenue(): Promise<number>;
  getRecentActivity(): Promise<Transaction[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async updateUserBalance(userId: string, balance: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ balance, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Product operations
  async getProducts(search?: string, category?: string): Promise<Product[]> {
    let query = db.select().from(products);
    
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )
      );
    }
    if (category) {
      conditions.push(eq(products.category, category));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.featured, true))
      .orderBy(desc(products.createdAt))
      .limit(6);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(Cart & { product: Product })[]> {
    return await db
      .select()
      .from(carts)
      .leftJoin(products, eq(carts.productId, products.id))
      .where(eq(carts.userId, userId))
      .then(rows => 
        rows.map(row => ({
          ...row.carts,
          product: row.products!,
        }))
      );
  }

  async addToCart(cartItem: InsertCart): Promise<Cart> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, cartItem.userId), eq(carts.productId, cartItem.productId)));

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(carts)
        .set({ 
          quantity: existingItem.quantity + (cartItem.quantity || 1),
          updatedAt: new Date()
        })
        .where(eq(carts.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [newItem] = await db.insert(carts).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<Cart | undefined> {
    const [updatedItem] = await db
      .update(carts)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(carts.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(carts).where(eq(carts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(carts).where(eq(carts.userId, userId));
    return (result.rowCount || 0) >= 0;
  }

  // Transaction operations
  async getTransactions(userId: string, type?: string): Promise<Transaction[]> {
    if (type) {
      return await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.type, type)))
        .orderBy(desc(transactions.createdAt));
    }
    
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ status, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getTotalRevenue(): Promise<number> {
    const result = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.type, "purchase"), eq(transactions.status, "completed")));
    
    return result.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
  }

  async getRecentActivity(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(10);
  }

  // Get all transactions for admin (no user filter)
  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  // Get pending transactions count
  async getPendingTransactionsCount(): Promise<number> {
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.status, "pending"));
    
    return result.length;
  }
}

export const storage = new DatabaseStorage();
