const { db } = require('./database');

const markLeave = (req, res) => {
    const { kid_id, leave_date } = req.body;

    // Check if leave is at least 1 day before
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leaveDate = new Date(leave_date);
    leaveDate.setHours(0, 0, 0, 0);

    if (leaveDate <= today) {
        return res.status(400).json({ error: 'Leave must be submitted at least 1 day before' });
    }

    db.run(
        'INSERT INTO leaves (kid_id, leave_date) VALUES (?, ?)',
        [kid_id, leave_date],
        function (err) {
            if (err) return res.status(500).json({ error: 'Leave already marked or database error' });
            res.status(201).json({ id: this.lastID, message: 'Leave marked' });
        }
    );
};

const getLeaves = (req, res) => {
    const { date } = req.query;
    let query = 'SELECT l.*, k.kid_name FROM leaves l JOIN kids_lunch_boxes k ON l.kid_id = k.id';
    let params = [];

    if (date) {
        query += ' WHERE l.leave_date = ?';
        params.push(date);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

module.exports = { markLeave, getLeaves };
