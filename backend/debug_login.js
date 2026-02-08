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

        if (user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            console.log(`Password match for "${password}": ${isMatch}`);

            const testHash = await bcrypt.hash(password, 10);
            console.log(`New hash for "${password}": ${testHash}`);
        } else {
            console.log('User has no password (likely Google/social login)');
        }

        db.close();
    });
};

const checkGoogleUser = (google_id) => {
    db.get('SELECT * FROM users WHERE google_id = ?', [google_id], (err, user) => {
        if (err) {
            console.error('DB Error:', err);
            return;
        }
        if (!user) {
            console.log(`Google user not found: ${google_id}`);
            db.all('SELECT email, google_id FROM users WHERE google_id IS NOT NULL', [], (err, rows) => {
                console.log('Existing Google users:', rows);
            });
            return;
        }

        console.log('Google user found:', {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            google_id: user.google_id,
            has_password: !!user.password
        });

        db.close();
    });
};

// Test regular email/password login
console.log('=== Testing Email/Password Login ===');
checkUser('customer@example.com', 'password123');

// Uncomment to test Google login (replace with actual google_id)
// console.log('\n=== Testing Google Login ===');
// checkGoogleUser('YOUR_GOOGLE_ID_HERE');
