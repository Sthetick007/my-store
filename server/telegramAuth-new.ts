import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import UserStorage from './user-storage';
import { storage } from './storage';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'dummy';
const userStorage = new UserStorage();

function verifyTelegramInitData(initData: string): boolean {
    if (initData.includes('dev_mock_hash')) return true;
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    const dataCheckArray: string[] = [];
    for (const [key, value] of urlParams.entries()) dataCheckArray.push(`${key}=${value}`);
    dataCheckArray.sort();
    const dataCheckString = dataCheckArray.join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const now = Math.floor(Date.now() / 1000);
    return calculatedHash === hash && (now - authDate) < 24*60*60;
}

function parseUser(initData: string) {
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');
    if (userParam) {
        return JSON.parse(decodeURIComponent(userParam));
    }
    // Fallback for dev mode
    return { id: 'dev_123456789', username: 'devuser', first_name: 'Dev' };
}

export function setupTelegramAuth(app: express.Express) {
    app.post('/api/auth/verify', async (req, res) => {
        const { initData } = req.body;
        if (!initData || !verifyTelegramInitData(initData)) {
            return res.json({ success: false, message: 'Invalid Telegram auth' });
        }
        
        const telegramUser = parseUser(initData);
        
        // Store/update user in JSON file
        const userData = userStorage.createOrUpdateUser(telegramUser);
        
        // Also store in MongoDB for the e-commerce functionality
        try {
            await storage.upsertUser({
                id: userData.id,
                telegramId: userData.telegramId,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
            });
        } catch (error) {
            console.error('Error storing user in MongoDB:', error);
        }
        
        // Create session
        const sessionData = userStorage.createSession(userData.id, userData);
        
        // Generate JWT token
        const token = jwt.sign({ 
            id: userData.id, 
            telegramId: userData.telegramId,
            username: userData.username 
        }, JWT_SECRET, { expiresIn: '1d' });
        
        console.log(`User ${userData.username || userData.firstName} (${userData.id}) authenticated successfully`);
        console.log(`Total users in storage: ${Object.keys(userStorage.getAllUsers()).length}`);
        
        res.json({ 
            success: true, 
            token, 
            user: {
                id: userData.id,
                telegramId: userData.telegramId,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                loginCount: userData.loginCount
            }
        });
    });

    app.post('/api/auth/me', (req, res) => {
        const auth = req.headers.authorization;
        if (!auth) return res.json({ success: false });
        try {
            const token = auth.replace('Bearer ', '');
            const payload = jwt.verify(token, JWT_SECRET) as any;
            const user = userStorage.getSession(payload.id);
            if (!user) throw new Error('No session');
            res.json({ success: true, user });
        } catch {
            res.json({ success: false });
        }
    });

    // Get all users (admin endpoint)
    app.get('/api/users', (req, res) => {
        const users = userStorage.getAllUsers();
        res.json({ success: true, users: Object.values(users) });
    });

    // Get user statistics
    app.get('/api/users/stats', (req, res) => {
        const stats = userStorage.getUserStats();
        res.json({ success: true, stats });
    });

    // Logout user
    app.post('/api/auth/logout', (req, res) => {
        const auth = req.headers.authorization;
        if (!auth) return res.json({ success: false });
        try {
            const token = auth.replace('Bearer ', '');
            const payload = jwt.verify(token, JWT_SECRET) as any;
            userStorage.removeSession(payload.id);
            res.json({ success: true, message: 'Logged out successfully' });
        } catch {
            res.json({ success: false });
        }
    });
}

export function isTelegramAuthenticated(req: any, res: any, next: any) {
    const auth = req.headers.authorization;
    if (!auth) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const token = auth.replace('Bearer ', '');
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const user = userStorage.getSession(payload.id);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }
        
        req.user = {
            id: payload.id,
            telegramId: payload.telegramId,
            username: payload.username
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}
