import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from './models/User';
import { storage } from './storage';
import dotenv from 'dotenv';

dotenv.config();

// Get JWT_SECRET from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Admin whitelist - these telegramIds will be allowed to access admin features
// In a production app, these would be stored in a database or as environment variables
const ADMIN_WHITELIST = (process.env.ADMIN_WHITELIST || '').split(',').filter(id => id);

// Admin credentials (should be stored securely in environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Default for dev only

// Hash admin password on startup if not already done
async function ensureAdminPasswordHashed() {
  if (!process.env.ADMIN_PASSWORD_HASH) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    console.log('⚠️ WARNING: ADMIN_PASSWORD_HASH not set in .env. Using default credentials.');
    console.log('Generated hash for current password:', hash);
    process.env.ADMIN_PASSWORD_HASH = hash;
  }
}
ensureAdminPasswordHashed();

export function setupAdminAuth(app: express.Express) {
  // Admin login endpoint
  app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('🔐 Admin login attempt:', { username });
    
    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    
    // Verify username
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Verify password using bcrypt
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || '';
    const passwordValid = await bcrypt.compare(password, passwordHash);
    
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate admin JWT token
    const token = jwt.sign({ 
      isAdmin: true,
      username: username
    }, JWT_SECRET, { expiresIn: '8h' });
    
    console.log(`Admin user ${username} authenticated successfully`);
    
    res.json({ 
      success: true, 
      token,
      user: {
        username: username,
        isAdmin: true
      }
    });
  });
  
  // Check if a user is on the admin whitelist - used to determine if they can see admin login option
  app.get('/api/admin/check-eligibility', async (req, res) => {
    const auth = req.headers.authorization;
    
    if (!auth) {
      return res.json({ success: false, eligible: false });
    }
    
    try {
      const token = auth.replace('Bearer ', '');
      const payload = jwt.verify(token, JWT_SECRET) as any;
      
      // If the user is already logged in as admin
      if (payload.isAdmin) {
        return res.json({ success: true, eligible: true, isAdmin: true });
      }
      
      // Check if the user's telegramId is in the whitelist
      if (payload.telegramId && ADMIN_WHITELIST.includes(payload.telegramId)) {
        return res.json({ success: true, eligible: true });
      }
      
      // If user is in MongoDB and is marked as admin
      const user = await storage.getUser(payload.id);
      if (user && user.isAdmin) {
        return res.json({ success: true, eligible: true });
      }
      
      // Not eligible
      return res.json({ success: true, eligible: false });
    } catch (error) {
      console.error('Error checking admin eligibility:', error);
      return res.json({ success: false, eligible: false });
    }
  });
}

// Middleware to verify admin authentication
export function isAdminAuthenticated(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    if (!payload.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    req.admin = {
      username: payload.username,
      isAdmin: true
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
