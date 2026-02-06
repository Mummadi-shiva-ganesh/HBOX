const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('lunchbox.db');

db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'", (err, row) => {
    if (err) {
        console.error('Error fetching schema:', err);
        process.exit(1);
    }
    if (!row) {
        console.error('Orders table not found');
        process.exit(1);
    }

    console.log('Current Schema:', row.sql);

    if (!row.sql.includes('Accepted')) {
        console.log('Schema is missing "Accepted" status. Resetting database to apply new schema...');
        // In a real migration we'd do more, but for this dev stage, let's just delete the DB and re-seed
        db.close(() => {
            const fs = require('fs');
            try {
                fs.unlinkSync('lunchbox.db');
                console.log('Database deleted. Please run seed.js to recreate.');
            } catch (e) {
                console.error('Error deleting DB:', e);
            }
        });
    } else {
        console.log('Schema is correct.');
        db.close();
    }
});
