const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Check if there are any existing user sessions
const dataDir = path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');

console.log('=== CHECKING USER STORAGE ===');

if (fs.existsSync(usersFile)) {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    console.log('Users in file storage:', Object.keys(users).length);
    Object.values(users).forEach(user => {
        console.log(`📝 User: ${user.id} | TelegramId: ${user.telegramId} | Name: ${user.firstName} ${user.lastName}`);
    });
} else {
    console.log('❌ No users file found');
}

if (fs.existsSync(sessionsFile)) {
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
    console.log('Sessions in file storage:', Object.keys(sessions).length);
    Object.values(sessions).forEach(session => {
        console.log(`🔐 Session: ${session.userId} | Created: ${session.createdAt}`);
    });
} else {
    console.log('❌ No sessions file found');
}

// Try to decode any existing token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkNiMXFiNnRZODJKNGJDdWZjWWoxSSIsInRlbGVncmFtSWQiOiJkZXZfMTIzNDU2Nzg5IiwidXNlcm5hbWUiOiJkZXZ1c2VyIiwiaWF0IjoxNzM2MjY3MjY0LCJleHAiOjE3MzYzNTM2NjR9.sample'; // This would be a real token

try {
    const JWT_SECRET = process.env.JWT_SECRET || 'telegram-webapp-super-secret-jwt-key-2024';
    console.log('\n=== CHECKING TOKEN ===');
    console.log('JWT Secret available:', !!JWT_SECRET);
    
    // This would typically be done with a real token from the browser
    // const decoded = jwt.verify(token, JWT_SECRET);
    // console.log('Decoded token:', decoded);
} catch (error) {
    console.log('Token decode failed:', error.message);
}
