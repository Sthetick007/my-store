#!/usr/bin/env node

import { db } from '../server/db.js';
import { products, users } from '../shared/schema.js';

console.log('🌱 Seeding database with sample data...\n');

async function seed() {
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.delete(products);
    
    // Insert sample products
    console.log('📦 Adding sample products...');
    const sampleProducts = [
      {
        name: 'Netflix Premium',
        description: 'Stream unlimited movies and TV shows in 4K Ultra HD. Access to Netflix Originals and exclusive content.',
        price: '15.99',
        category: 'OTT',
        image_url: 'https://images.pexels.com/photos/4009402/pexels-photo-4009402.jpeg',
        stock: 100,
        featured: true
      },
      {
        name: 'Spotify Premium',
        description: 'Ad-free music streaming with offline downloads. Access to over 100 million songs and podcasts.',
        price: '9.99',
        category: 'OTT',
        image_url: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
        stock: 100,
        featured: true
      },
      {
        name: 'Disney+ Hotstar',
        description: 'Watch Disney, Marvel, Star Wars, and exclusive Hotstar content. Live sports and regional content.',
        price: '12.99',
        category: 'OTT',
        image_url: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg',
        stock: 100,
        featured: true
      },
      {
        name: 'NordVPN Premium',
        description: 'Secure VPN with 5000+ servers worldwide. Military-grade encryption and no-logs policy.',
        price: '11.95',
        category: 'VPN',
        image_url: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg',
        stock: 50,
        featured: false
      },
      {
        name: 'ExpressVPN',
        description: 'Lightning-fast VPN with servers in 94 countries. 24/7 customer support and 30-day guarantee.',
        price: '12.95',
        category: 'VPN',
        image_url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
        stock: 50,
        featured: false
      },
      {
        name: 'Adobe Creative Cloud',
        description: 'Complete creative suite including Photoshop, Illustrator, Premiere Pro, and more.',
        price: '52.99',
        category: 'Others',
        image_url: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg',
        stock: 25,
        featured: true
      },
      {
        name: 'Microsoft 365',
        description: 'Office apps, cloud storage, and premium features. Word, Excel, PowerPoint, and Teams included.',
        price: '6.99',
        category: 'Others',
        image_url: 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg',
        stock: 75,
        featured: false
      },
      {
        name: 'YouTube Premium',
        description: 'Ad-free YouTube, background play, and YouTube Music included. Download videos for offline viewing.',
        price: '11.99',
        category: 'OTT',
        image_url: 'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg',
        stock: 100,
        featured: false
      }
    ];

    await db.insert(products).values(sampleProducts);
    console.log(`✅ Added ${sampleProducts.length} sample products`);

    // Create admin user
    console.log('👤 Creating admin user...');
    await db.insert(users).values({
      id: 'admin-123456789',
      email: 'admin@teleshop.com',
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      telegramId: '123456789',
      isAdmin: true,
      balance: '1000.00'
    }).onConflictDoNothing();
    console.log('✅ Admin user created (ID: admin-123456789)');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Sample data added:');
    console.log(`- ${sampleProducts.length} products across OTT, VPN, and Others categories`);
    console.log('- 1 admin user for testing');
    console.log('\n🔑 Admin credentials:');
    console.log('- Telegram ID: 123456789');
    console.log('- Username: admin');
    console.log('- Balance: $1000.00');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();