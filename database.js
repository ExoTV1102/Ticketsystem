const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use a file-based database. 
// In Docker, we will mount a volume to persist this file.
const dbPath = path.resolve(__dirname, 'tickets.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Create Stations table
    db.run(`CREATE TABLE IF NOT EXISTS stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )`);

    // Create Connections table
    db.run(`CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_station_id INTEGER NOT NULL,
        to_station_id INTEGER NOT NULL,
        departure_time TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY(from_station_id) REFERENCES stations(id),
        FOREIGN KEY(to_station_id) REFERENCES stations(id)
    )`);

    // Create Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        connection_id INTEGER NOT NULL,
        passenger_name TEXT NOT NULL,
        booking_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(connection_id) REFERENCES connections(id)
    )`);

    // Seed data if empty
    db.get("SELECT count(*) as count FROM stations", (err, row) => {
        if (err) return console.error(err.message);
        if (row.count === 0) {
            console.log("Seeding data...");
            const stmt = db.prepare("INSERT INTO stations (name) VALUES (?)");
            const stations = [
                "Berlin", "München", "Hamburg", "Frankfurt", "Köln",
                "Wien", "Salzburg", "Innsbruck", "Graz"
            ];

            stations.forEach(station => stmt.run(station));

            stmt.finalize(() => {
                // Helper to insert connection
                const connStmt = db.prepare("INSERT INTO connections (from_station_id, to_station_id, departure_time, arrival_time, price) VALUES (?, ?, ?, ?, ?)");

                // Station IDs (assuming auto-increment starts at 1):
                // 1: Berlin, 2: München, 3: Hamburg, 4: Frankfurt, 5: Köln
                // 6: Wien, 7: Salzburg, 8: Innsbruck, 9: Graz

                const connections = [
                    // Berlin (1) <-> München (2)
                    [1, 2, "06:00", "10:30", 89.90],
                    [1, 2, "08:00", "12:30", 99.90],
                    [1, 2, "10:00", "14:30", 109.90],
                    [1, 2, "12:00", "16:30", 89.90],
                    [1, 2, "14:00", "18:30", 79.90],
                    [1, 2, "16:00", "20:30", 69.90],
                    [2, 1, "07:00", "11:30", 89.90],
                    [2, 1, "09:00", "13:30", 99.90],
                    [2, 1, "11:00", "15:30", 109.90],
                    [2, 1, "13:00", "17:30", 89.90],
                    [2, 1, "15:00", "19:30", 79.90],

                    // Hamburg (3) <-> Berlin (1)
                    [3, 1, "07:30", "09:15", 39.90],
                    [3, 1, "09:30", "11:15", 49.90],
                    [3, 1, "13:30", "15:15", 29.90],
                    [1, 3, "08:00", "09:45", 39.90],
                    [1, 3, "10:00", "11:45", 49.90],
                    [1, 3, "16:00", "17:45", 59.90],

                    // München (2) <-> Wien (6)
                    [2, 6, "07:30", "11:30", 65.50],
                    [2, 6, "09:30", "13:30", 75.50],
                    [2, 6, "13:30", "17:30", 55.50],
                    [6, 2, "08:30", "12:30", 65.50],
                    [6, 2, "10:30", "14:30", 75.50],
                    [6, 2, "14:30", "18:30", 55.50],

                    // München (2) <-> Salzburg (7)
                    [2, 7, "08:00", "09:30", 25.90],
                    [2, 7, "10:00", "11:30", 29.90],
                    [2, 7, "14:00", "15:30", 22.90],
                    [7, 2, "09:00", "10:30", 25.90],
                    [7, 2, "11:00", "12:30", 29.90],
                    [7, 2, "15:00", "16:30", 22.90],

                    // Wien (6) <-> Salzburg (7)
                    [6, 7, "07:00", "09:30", 49.90],
                    [6, 7, "09:00", "11:30", 59.90],
                    [6, 7, "15:00", "17:30", 45.90],
                    [7, 6, "08:00", "10:30", 49.90],
                    [7, 6, "10:00", "12:30", 59.90],
                    [7, 6, "16:00", "18:30", 45.90],

                    // Wien (6) <-> Graz (9)
                    [6, 9, "08:00", "10:30", 35.90],
                    [6, 9, "12:00", "14:30", 35.90],
                    [9, 6, "09:00", "11:30", 35.90],
                    [9, 6, "13:00", "15:30", 35.90],

                    // Innsbruck (8) <-> Salzburg (7)
                    [8, 7, "08:00", "10:00", 32.90],
                    [7, 8, "11:00", "13:00", 32.90],

                    // Frankfurt (4) <-> Köln (5)
                    [4, 5, "07:00", "08:00", 29.90],
                    [4, 5, "09:00", "10:00", 39.90],
                    [5, 4, "08:00", "09:00", 29.90],
                    [5, 4, "10:00", "11:00", 39.90]
                ];

                connections.forEach(conn => {
                    connStmt.run(conn[0], conn[1], conn[2], conn[3], conn[4]);
                });

                connStmt.finalize();
                console.log("Data seeded with expanded German and Austrian connections.");
            });
        }
    });
});

module.exports = db;
