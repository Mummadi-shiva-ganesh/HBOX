const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('./database');

const register = async (req, res) => {
    const { name, email, password, role, phone, google_id } = req.body;
    const hashedPassword = password ? await bcrypt.hash(password, 8) : null;

    // Convert empty strings to null for unique constraints
    const cleanPhone = phone === '' ? null : phone;
    const cleanGoogleId = google_id === '' ? null : google_id;

    db.run(
        'INSERT INTO users (name, email, password, role, phone, google_id) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, role || 'customer', cleanPhone, cleanGoogleId],
        function (err) {
            if (err) {
                console.error("Registration Error:", err);
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('users.email')) {
                        return res.status(400).json({ error: 'Email already registered' });
                    }
                    if (err.message.includes('users.phone')) {
                        return res.status(400).json({ error: 'Phone number already registered' });
                    }
                    return res.status(400).json({ error: 'User already exists' });
                }
                return res.status(500).json({ error: 'Database error. Please try again later.' });
            }
            res.status(201).json({ id: this.lastID, name, email, role: role || 'customer' });
        }
    );
};

const login = (req, res) => {
    const { email, password, google_id, phone } = req.body;

    let query = 'SELECT * FROM users WHERE email = ?';
    let params = [email];

    if (google_id) {
        query = 'SELECT * FROM users WHERE google_id = ?';
        params = [google_id];
    } else if (phone) {
        query = 'SELECT * FROM users WHERE phone = ?';
        params = [phone];
    }

    db.get(query, params, async (err, user) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            if (google_id || phone) {
                // Return a special status for "New user via Social/Phone"
                return res.status(200).json({ newUser: true, google_id, phone });
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Only check password for email/password login (not for Google or phone login)
        if (email && password && !google_id && !phone) {
            if (!user.password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    });
};

const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const authorize = (roles) => (req, res, next) => {
    if (!roles.includes(req.userRole)) return res.status(403).json({ error: 'Forbidden' });
    next();
};

module.exports = { register, login, authenticate, authorize };
