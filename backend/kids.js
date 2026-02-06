const { db } = require('./database');

const getKids = (req, res) => {
    const customerId = req.userId;
    db.all('SELECT * FROM kids_lunch_boxes WHERE customer_id = ?', [customerId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

const addKid = (req, res) => {
    const customerId = req.userId;
    const { kid_name, school_name, school_address, parent_phone, delivery_address, school_lat, school_lng } = req.body;
    db.run(
        'INSERT INTO kids_lunch_boxes (customer_id, kid_name, school_name, school_address, parent_phone, delivery_address, school_lat, school_lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [customerId, kid_name, school_name, school_address, parent_phone, delivery_address, school_lat, school_lng],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        }
    );
};

const updateKid = (req, res) => {
    const { id } = req.params;
    const { kid_name, school_name, school_address, parent_phone, delivery_address, school_lat, school_lng } = req.body;
    db.run(
        'UPDATE kids_lunch_boxes SET kid_name = ?, school_name = ?, school_address = ?, parent_phone = ?, delivery_address = ?, school_lat = ?, school_lng = ? WHERE id = ?',
        [kid_name, school_name, school_address, parent_phone, delivery_address, school_lat, school_lng, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Kid profile updated' });
        }
    );
};

const getAllKids = (req, res) => {
    db.all('SELECT * FROM kids_lunch_boxes', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

module.exports = { getKids, addKid, updateKid, getAllKids };
