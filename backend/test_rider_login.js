const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('lunchbox.db');

const email = 'rider@example.com';
const password = 'password123';

db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
        console.error('DB Error:', err);
        return;
    }
    if (!user) {
        console.error('User not found');
        return;
    }

    console.log('User found:', user.email, 'Role:', user.role);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    db.close();
});
