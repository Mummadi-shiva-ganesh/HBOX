const { db, initDb } = require('./database');
const bcrypt = require('bcryptjs');

const run = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const seed = async () => {
    try {
        console.log('Force dropping old tables...');
        // Drop in reverse order of dependencies
        await run('DROP TABLE IF EXISTS locations').catch(() => { });
        await run('DROP TABLE IF EXISTS orders').catch(() => { });
        await run('DROP TABLE IF EXISTS leaves').catch(() => { });
        await run('DROP TABLE IF EXISTS kids_lunch_boxes').catch(() => { });
        await run('DROP TABLE IF EXISTS users').catch(() => { });

        console.log('Initializing database tables with fresh schema...');
        initDb();

        // Give it a moment to serialize the table creation
        await new Promise(resolve => setTimeout(resolve, 2000));

        const password = await bcrypt.hash('password123', 10);
        console.log('Password hash generated.');

        await run('INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
            ['Admin User', 'admin@example.com', password, 'admin', '9876543210', 'Head Office']);
        await run('INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
            ['Rahul Sharma', 'customer@example.com', password, 'customer', '9988776655', 'Apartment 402']);
        await run('INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
            ['Suresh Kumar', 'rider@example.com', password, 'rider', '9123456789', 'Rider Hub']);
        console.log('Users inserted.');

        // Get customer id (should be 2)
        const customer = await new Promise((res) => db.get("SELECT id FROM users WHERE email = 'customer@example.com'", (err, row) => res(row)));
        const rider = await new Promise((res) => db.get("SELECT id FROM users WHERE email = 'rider@example.com'", (err, row) => res(row)));

        await run('INSERT INTO kids_lunch_boxes (customer_id, kid_name, school_name, school_address, school_lat, school_lng, parent_phone, delivery_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [customer.id, 'Aryan Sharma', 'St. Xavier\'s', 'Richmond Road', 12.9667, 77.6067, '9876543210', '123, Marathahalli']);
        await run('INSERT INTO kids_lunch_boxes (customer_id, kid_name, school_name, school_address, school_lat, school_lng, parent_phone, delivery_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [customer.id, 'Sia Gupta', 'Greenwood High', 'Koramangala', 12.9348, 77.6109, '9876543211', '456, HSR Layout']);
        console.log('Kids inserted.');

        const kids = await new Promise((res) => db.all("SELECT id FROM kids_lunch_boxes", (err, rows) => res(rows)));

        const today = new Date().toISOString().split('T')[0];
        await run('INSERT INTO orders (customer_id, kid_id, order_date, status, rider_id, estimated_time) VALUES (?, ?, ?, ?, ?, ?)',
            [customer.id, kids[0].id, today, 'Out for Delivery', rider.id, '12:45 PM']);
        await run('INSERT INTO orders (customer_id, kid_id, order_date, status, rider_id, estimated_time) VALUES (?, ?, ?, ?, ?, ?)',
            [customer.id, kids[1].id, today, 'Packed', rider.id, '01:15 PM']);
        console.log('Orders inserted.');

        console.log('Seeding complete. Verifying...');
        db.all('SELECT email, role FROM users', [], (err, rows) => {
            console.log('Users in DB:', rows);
            db.close();
        });

    } catch (err) {
        console.error('Seed Failed:', err);
        db.close();
    }
};

seed();
