import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

interface TelegramUser {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface StoredUser {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  loginCount: number;
  createdAt: string;
  lastLogin: string;
}

interface Session {
  userId: string;
  user: StoredUser;
  createdAt: string;
}

export default class UserStorage {
  private usersFile: string;
  private sessionsFile: string;

  constructor() {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.usersFile = path.join(dataDir, 'users.json');
    this.sessionsFile = path.join(dataDir, 'sessions.json');
    
    // Initialize files if they don't exist
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, '{}');
    }
    if (!fs.existsSync(this.sessionsFile)) {
      fs.writeFileSync(this.sessionsFile, '{}');
    }
  }

  private readUsers(): Record<string, StoredUser> {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private writeUsers(users: Record<string, StoredUser>): void {
    fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
  }

  private readSessions(): Record<string, Session> {
    try {
      const data = fs.readFileSync(this.sessionsFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private writeSessions(sessions: Record<string, Session>): void {
    fs.writeFileSync(this.sessionsFile, JSON.stringify(sessions, null, 2));
  }

  createOrUpdateUser(telegramUser: TelegramUser): StoredUser {
    const users = this.readUsers();
    const existing = Object.values(users).find(u => u.telegramId === telegramUser.id);
    
    if (existing) {
      // Update existing user
      existing.loginCount += 1;
      existing.lastLogin = new Date().toISOString();
      if (telegramUser.username) existing.username = telegramUser.username;
      if (telegramUser.first_name) existing.firstName = telegramUser.first_name;
      if (telegramUser.last_name) existing.lastName = telegramUser.last_name;
      
      users[existing.id] = existing;
      this.writeUsers(users);
      return existing;
    } else {
      // Create new user
      const newUser: StoredUser = {
        id: nanoid(),
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        loginCount: 1,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      users[newUser.id] = newUser;
      this.writeUsers(users);
      return newUser;
    }
  }

  createSession(userId: string, user: StoredUser): Session {
    const sessions = this.readSessions();
    const session: Session = {
      userId,
      user,
      createdAt: new Date().toISOString()
    };
    
    sessions[userId] = session;
    this.writeSessions(sessions);
    return session;
  }

  getSession(userId: string): StoredUser | null {
    const sessions = this.readSessions();
    const session = sessions[userId];
    return session ? session.user : null;
  }

  removeSession(userId: string): void {
    const sessions = this.readSessions();
    delete sessions[userId];
    this.writeSessions(sessions);
  }

  getAllUsers(): Record<string, StoredUser> {
    return this.readUsers();
  }

  getUserStats() {
    const users = this.readUsers();
    const userArray = Object.values(users);
    
    return {
      totalUsers: userArray.length,
      totalLogins: userArray.reduce((sum, user) => sum + user.loginCount, 0),
      averageLoginsPerUser: userArray.length > 0 ? 
        userArray.reduce((sum, user) => sum + user.loginCount, 0) / userArray.length : 0
    };
  }
}
