require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const pool = require('../src/db');

async function createAdmin() {
  try {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const [existing] = await pool.query(
      'SELECT id, email FROM users WHERE email = ?',
      ['admin@test.com']
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE users SET password_hash = ?, role = ? WHERE email = ?',  // Changed to password_hash
        [hashedPassword, 'admin', 'admin@test.com']
      );
      console.log('✅ Admin user updated successfully!');
    } else {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',  // Changed to password_hash
        ['Admin User', 'admin@test.com', hashedPassword, 'admin', '1234567890']
      );
      console.log('✅ Admin user created successfully!');
    }

    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();