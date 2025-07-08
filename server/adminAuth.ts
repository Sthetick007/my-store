import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import dotenv from 'dotenv';

dotenv.config();

// Get JWT_SECRET from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Admin credentials (should be stored securely in environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Default for dev only

// Hash admin password on startup if not already done
async function ensureAdminPasswordHashed() {
  // Always generate a new hash for demonstration purposes
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  console.log('⚠️ WARNING: ADMIN_PASSWORD_HASH not set in .env. Using default credentials.');
  console.log('Generated hash for current password:', hash);
  process.env.ADMIN_PASSWORD_HASH = hash;
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
}

// Middleware to verify admin authentication
export function isAdminAuthenticated(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  console.log('🔐 Admin auth check - Authorization header:', auth ? 'present' : 'missing');
  
  if (!auth) {
    console.log('❌ No authorization header');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token = auth.replace('Bearer ', '');
    console.log('🔑 Token extracted:', token ? 'present' : 'empty');
    
    const payload = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ Token payload:', payload);
    
    if (!payload.isAdmin) {
      console.log('❌ Token is not admin');
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    req.admin = {
      username: payload.username,
      isAdmin: true
    };
    
    console.log('✅ Admin authenticated successfully');
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
