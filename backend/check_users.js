const { db } = require('./database');

db.all('SELECT id, name, email, role, google_id FROM users', [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Current Users:', JSON.stringify(rows, null, 2));
    }
    db.close();
});
