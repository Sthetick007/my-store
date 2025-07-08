import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupTelegramAuth } from "./telegramAuth";
import { setupAdminAuth } from "./adminAuth";

// Import route modules
import productRoutes from "./routes/product-routes";
import cartRoutes from "./routes/cart-routes";
import transactionRoutes from "./routes/transaction-routes";
import adminRoutes from "./routes/admin-routes";
import userRoutes from "./routes/user-routes";
import miscRoutes from "./routes/misc-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Telegram auth
  setupTelegramAuth(app);
  
  // Setup Admin auth
  setupAdminAuth(app);

  // Register route modules
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api', miscRoutes); // For health and webhook routes

  const httpServer = createServer(app);
  return httpServer;
}
