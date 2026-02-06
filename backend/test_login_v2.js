const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'lunchbox.db');
const db = new sqlite3.Database(dbPath);

const email = 'rider@example.com';
const password = 'password123';

db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
        console.error('DB Error:', err);
        process.exit(1);
    }
    if (!user) {
        console.error('User not found');
        process.exit(1);
    }

    console.log('User found:', user.email, 'Role:', user.role);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    db.close();
});
