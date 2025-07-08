#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up TeleShop...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...');
  fs.copyFileSync('.env.example', '.env');
  console.log('✅ .env file created. Please update with your values.\n');
} else {
  console.log('✅ .env file already exists.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed.\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Check database connection
console.log('🗄️ Checking database connection...');
try {
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('✅ Database schema updated.\n');
} catch (error) {
  console.error('❌ Database setup failed. Please check your DATABASE_URL.');
  console.error('Make sure your PostgreSQL database is running and accessible.\n');
}

// Seed database with sample data
console.log('🌱 Seeding database with sample data...');
try {
  execSync('node scripts/seed.js', { stdio: 'inherit' });
  console.log('✅ Sample data added.\n');
} catch (error) {
  console.log('⚠️ Seeding failed, but that\'s okay for first setup.\n');
}

console.log('🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Update your .env file with real values');
console.log('2. Set up your Telegram bot (optional)');
console.log('3. Run: npm run dev');
console.log('4. Open your app in Telegram WebApp\n');

console.log('🔗 Useful commands:');
console.log('- npm run dev     : Start development server');
console.log('- npm run build   : Build for production');
console.log('- npm run db:push : Update database schema');
console.log('- npm run check   : Type check');