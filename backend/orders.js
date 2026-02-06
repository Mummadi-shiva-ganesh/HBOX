const { db } = require('./database');

const createOrder = (req, res) => {
    const { customer_id, kid_id, order_date } = req.body;
    db.run(
        'INSERT INTO orders (customer_id, kid_id, order_date) VALUES (?, ?, ?)',
        [customer_id, kid_id, order_date],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        }
    );
};

const getOrders = (req, res) => {
    const { date, role, userId } = req.query;
    let query = `
        SELECT o.*, 
               u.name as customer_name, 
               k.kid_name, 
               k.school_name, 
               k.school_address, 
               COALESCE(k.school_lat, 12.9716) as school_lat,
               COALESCE(k.school_lng, 77.5946) as school_lng,
               k.delivery_address,
               r.name as rider_name, 
               r.phone as rider_phone, 
               r.avatar as rider_avatar,
               (SELECT 1 FROM leaves l WHERE l.kid_id = o.kid_id AND l.leave_date = o.order_date) as is_on_leave
        FROM orders o 
        JOIN users u ON o.customer_id = u.id 
        JOIN kids_lunch_boxes k ON o.kid_id = k.id
        LEFT JOIN users r ON o.rider_id = r.id`;
    let params = [];

    if (date) {
        query += ' WHERE o.order_date = ?';
        params.push(date);
    }

    if (role === 'customer') {
        query += (params.length ? ' AND' : ' WHERE') + ' o.customer_id = ?';
        params.push(userId);
    } else if (role === 'rider') {
        query += (params.length ? ' AND' : ' WHERE') + ' (o.rider_id = ? OR (o.rider_id IS NULL AND o.status = "Packed"))';
        params.push(userId);
        query += ' AND is_on_leave IS NULL'; // Rider should not see lunch boxes on leave
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

const updateOrderStatus = (req, res) => {
    const { id } = req.params;
    const { status, rider_id, estimated_time } = req.body;

    let updates = [];
    let params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (rider_id) { updates.push('rider_id = ?'); params.push(rider_id); }
    if (estimated_time) { updates.push('estimated_time = ?'); params.push(estimated_time); }

    params.push(id);

    db.run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Order updated' });
    });
};

module.exports = { createOrder, getOrders, updateOrderStatus };
