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
    console.log('🔍 Verifying initData:', initData.substring(0, 200) + '...');
    
    // Allow dev mode with mock hash
    if (initData.includes('dev_mock_hash')) {
        console.log('✅ Using dev mock hash - DEVELOPMENT MODE');
        return true;
    }
    
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        
        if (!hash) {
            console.log('❌ No hash found in initData');
            return false;
        }
        
        console.log('📝 Hash from initData:', hash);
        
        // Remove hash from params for verification
        urlParams.delete('hash');
        const dataCheckArray: string[] = [];
        urlParams.forEach((value, key) => {
            dataCheckArray.push(`${key}=${value}`);
        });
        dataCheckArray.sort();
        const dataCheckString = dataCheckArray.join('\n');
        
        console.log('📊 Data check string:', dataCheckString);
        
        // Create secret key from bot token
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        
        // Check auth_date (should be within last 24 hours)
        const authDate = parseInt(urlParams.get('auth_date') || '0');
        const now = Math.floor(Date.now() / 1000);
        const timeDiff = now - authDate;
        const isTimeValid = timeDiff < 24 * 60 * 60; // 24 hours
        
        console.log('🔑 Verification details:', {
            providedHash: hash,
            calculatedHash: calculatedHash,
            authDate: authDate,
            now: now,
            timeDiff: timeDiff,
            hashMatch: calculatedHash === hash,
            timeValid: isTimeValid
        });
        
        const isValid = calculatedHash === hash && isTimeValid;
        
        if (!isValid) {
            console.log('❌ Telegram auth verification failed');
            if (calculatedHash !== hash) {
                console.log('Hash mismatch - possible data tampering');
            }
            if (!isTimeValid) {
                console.log('Auth data too old - please refresh');
            }
        } else {
            console.log('✅ Telegram auth verification successful');
        }
        
        return isValid;
    } catch (error) {
        console.error('❌ Error during Telegram auth verification:', error);
        return false;
    }
}

function parseUser(initData: string) {
    try {
        const urlParams = new URLSearchParams(initData);
        const userParam = urlParams.get('user');
        
        if (userParam) {
            const user = JSON.parse(decodeURIComponent(userParam));
            console.log('📋 Parsed real Telegram user:', {
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                language_code: user.language_code
            });
            return user;
        }
        
        // Fallback for dev mode
        console.log('⚠️ No user param found, using dev fallback');
        return { 
            id: 'dev_123456789', 
            username: 'devuser', 
            first_name: 'Dev',
            last_name: 'User',
            language_code: 'en'
        };
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        // Return dev user as fallback
        return { 
            id: 'dev_123456789', 
            username: 'devuser', 
            first_name: 'Dev',
            last_name: 'User',
            language_code: 'en'
        };
    }
}

export function setupTelegramAuth(app: express.Express) {
    app.post('/api/auth/verify', async (req, res) => {
        const { initData } = req.body;
        
        console.log('🔐 Auth request received:', {
            hasInitData: !!initData,
            initDataLength: initData?.length || 0,
            initDataPreview: initData ? initData.substring(0, 100) + '...' : 'none'
        });
        
        if (!initData || !verifyTelegramInitData(initData)) {
            console.log('❌ Auth failed: Invalid Telegram auth');
            return res.json({ success: false, message: 'Invalid Telegram auth' });
        }
        
        const telegramUser = parseUser(initData);
        
        console.log('👤 Parsed Telegram user:', {
            id: telegramUser.id,
            username: telegramUser.username,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name
        });
        
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

    app.post('/api/auth/me', async (req, res) => {
        const auth = req.headers.authorization;
        if (!auth) return res.json({ success: false });
        try {
            const token = auth.replace('Bearer ', '');
            const payload = jwt.verify(token, JWT_SECRET) as any;
            const sessionUser = userStorage.getSession(payload.id);
            if (!sessionUser) throw new Error('No session');
            
            // Get fresh user data from main storage to ensure balance is up-to-date
            const freshUser = await storage.getUser(payload.id);
            if (freshUser) {
                // Merge session data with fresh balance data
                const userData = {
                    ...sessionUser,
                    balance: freshUser.balance || 0
                };
                res.json({ success: true, user: userData });
            } else {
                res.json({ success: true, user: sessionUser });
            }
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
