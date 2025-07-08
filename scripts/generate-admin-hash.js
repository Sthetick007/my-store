const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'admin123';  // Default password from .env
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hash for admin123:', hash);
}

hashPassword().catch(console.error);
