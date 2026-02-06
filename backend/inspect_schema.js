const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'lunchbox.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) console.error(err);
    console.log('Users table schema:', rows);
    db.close();
});
