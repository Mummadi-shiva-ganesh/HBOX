const { db } = require('./database');

const getProfile = (req, res) => {
    const userId = req.userId;
    db.get('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    });
};

const updateProfile = (req, res) => {
    const userId = req.userId;
    const { name, phone, address } = req.body;

    db.run(
        'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
        [name, phone, address, userId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Profile updated successfully' });
        }
    );
};

module.exports = { getProfile, updateProfile };
