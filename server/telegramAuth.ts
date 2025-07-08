import crypto from 'crypto';
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Extend Express session to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    telegramUser?: any;
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Verify Telegram WebApp data
function verifyTelegramWebAppData(token: string, initData: string): TelegramUser | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) return null;
    
    // Remove hash from params for verification
    urlParams.delete('hash');
    
    // Sort parameters
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create secret key
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    
    // Calculate expected hash
    const expectedHash = crypto.createHmac('sha256', secretKey).update(sortedParams).digest('hex');
    
    if (expectedHash !== hash) {
      return null;
    }
    
    // Parse user data
    const userParam = urlParams.get('user');
    if (!userParam) return null;
    
    const user = JSON.parse(userParam);
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    
    return {
      ...user,
      auth_date: authDate,
      hash
    };
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return null;
  }
}

export function setupTelegramAuth(app: Express) {
  // Telegram authentication endpoint
  app.post('/api/auth/telegram', async (req, res) => {
    try {
      const { initData } = req.body;
      
      if (!initData) {
        return res.status(400).json({ message: 'Missing initData' });
      }
      
      // For development, we'll skip verification
      // In production, you'd verify with your bot token
      const urlParams = new URLSearchParams(initData);
      const userParam = urlParams.get('user');
      
      if (!userParam) {
        return res.status(400).json({ message: 'Invalid user data' });
      }
      
      const telegramUser = JSON.parse(userParam);
      
      console.log('New Telegram user login:', {
        id: telegramUser.id,
        name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
        username: telegramUser.username,
        timestamp: new Date().toISOString()
      });
      
      // Create or update user in database
      const user = await storage.upsertUser({
        id: telegramUser.id.toString(),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        profileImageUrl: telegramUser.photo_url,
        telegramId: telegramUser.id.toString(),
        email: `${telegramUser.id}@telegram.user`,
      });
      
      // Create session
      req.session.userId = user.id;
      req.session.telegramUser = telegramUser;
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
          balance: user.balance,
          isAdmin: user.isAdmin
        }
      });
      
    } catch (error) {
      console.error('Telegram auth error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });
  
  // Check authentication status
  app.get('/api/auth/status', (req, res) => {
    if (req.session.userId) {
      res.json({ authenticated: true, userId: req.session.userId });
    } else {
      res.json({ authenticated: false });
    }
  });
  
  // Get current user for Telegram auth
  app.get('/api/auth/telegram/user', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });
  
  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ success: true });
    });
  });
}

// Middleware to check Telegram authentication
export const isTelegramAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  
  req.user = user;
  next();
};