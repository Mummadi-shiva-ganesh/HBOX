const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'lunchbox.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT CHECK(role IN ('customer', 'rider', 'admin')) DEFAULT 'customer',
            phone TEXT UNIQUE,
            google_id TEXT UNIQUE,
            avatar TEXT,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Kids Lunch Boxes Table
        db.run(`CREATE TABLE IF NOT EXISTS kids_lunch_boxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            kid_name TEXT NOT NULL,
            school_name TEXT NOT NULL,
            school_address TEXT NOT NULL,
            school_lat REAL,
            school_lng REAL,
            parent_phone TEXT NOT NULL,
            delivery_address TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES users(id)
        )`);

        // Leaves Table
        db.run(`CREATE TABLE IF NOT EXISTS leaves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kid_id INTEGER NOT NULL,
            leave_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (kid_id) REFERENCES kids_lunch_boxes(id),
            UNIQUE(kid_id, leave_date)
        )`);

        // Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            kid_id INTEGER NOT NULL,
            order_date TEXT NOT NULL,
            status TEXT CHECK(status IN ('Packed', 'Accepted', 'Picked Up', 'Out for Delivery', 'Delivered')) DEFAULT 'Packed',
            rider_id INTEGER,
            estimated_time TEXT,
            FOREIGN KEY (customer_id) REFERENCES users(id),
            FOREIGN KEY (kid_id) REFERENCES kids_lunch_boxes(id),
            FOREIGN KEY (rider_id) REFERENCES users(id)
        )`);

        // Locations Table
        db.run(`CREATE TABLE IF NOT EXISTS locations (
            rider_id INTEGER PRIMARY KEY,
            latitude REAL,
            longitude REAL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (rider_id) REFERENCES users(id)
        )`);
    });
};

module.exports = { db, initDb };
