const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'lunchbox.db');
const db = new sqlite3.Database(dbPath);

const checkUser = async (email, password) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('DB Error:', err);
            return;
        }
        if (!user) {
            console.log(`User not found: ${email}`);
            db.all('SELECT email FROM users', [], (err, rows) => {
                console.log('Existing users:', rows.map(r => r.email).join(', '));
            });
            return;
        }

        console.log(`User found: ${user.email}`);
        console.log(`Stored Hash: ${user.password}`);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password match for "${password}": ${isMatch}`);

        const testHash = await bcrypt.hash(password, 10);
        console.log(`New hash for "${password}": ${testHash}`);

        db.close();
    });
};

checkUser('customer@example.com', 'password123');
