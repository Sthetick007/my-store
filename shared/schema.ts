import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  telegramId: z.string(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isAdmin: z.boolean().default(false),
  balance: z.number().default(0),
  loginCount: z.number().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertUserSchema = userSchema.omit({ createdAt: true, updatedAt: true });
export const upsertUserSchema = userSchema.partial().required({ telegramId: true });

// Product schema
export const productSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().optional(),
  image_url: z.string().url().optional(),
  stock: z.number().int().min(0).default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertProductSchema = productSchema.omit({ _id: true, createdAt: true, updatedAt: true });

// Cart schema
export const cartSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertCartSchema = cartSchema.omit({ _id: true, createdAt: true, updatedAt: true });

// Transaction schema
export const transactionSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  type: z.enum(['deposit', 'withdrawal', 'purchase', 'refund']),
  amount: z.number().positive(),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed']).default('pending'),
  metadata: z.any().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertTransactionSchema = transactionSchema.omit({ _id: true, createdAt: true, updatedAt: true });

// Types
export type User = z.infer<typeof userSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type Product = z.infer<typeof productSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
