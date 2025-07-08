#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

console.log('🧪 Testing authentication system...\n');

async function testAuth() {
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test Telegram auth with mock data
    console.log('\n2. Testing Telegram authentication...');
    const mockTelegramData = {
      initData: 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%7D&auth_date=1640995200&hash=mock_hash'
    };

    const authResponse = await fetch(`${BASE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockTelegramData)
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Telegram auth successful:', authData);
    } else {
      console.log('❌ Telegram auth failed:', await authResponse.text());
    }

    // Test products endpoint
    console.log('\n3. Testing products endpoint...');
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    const productsData = await productsResponse.json();
    console.log(`✅ Products loaded: ${productsData.length} items`);

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAuth();