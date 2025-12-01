const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get all stations
app.get('/api/stations', (req, res) => {
    db.all("SELECT * FROM stations", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Search connections
app.get('/api/connections', (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
        res.status(400).json({ "error": "Please provide 'from' and 'to' station IDs" });
        return;
    }

    const sql = `
        SELECT c.*, 
               s1.name as from_station_name, 
               s2.name as to_station_name 
        FROM connections c
        JOIN stations s1 ON c.from_station_id = s1.id
        JOIN stations s2 ON c.to_station_id = s2.id
        WHERE c.from_station_id = ? AND c.to_station_id = ?
    `;

    db.all(sql, [from, to], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Create a booking
app.post('/api/bookings', (req, res) => {
    const { connection_id, passenger_name } = req.body;
    if (!connection_id || !passenger_name) {
        res.status(400).json({ "error": "Please provide connection_id and passenger_name" });
        return;
    }

    const sql = 'INSERT INTO bookings (connection_id, passenger_name) VALUES (?, ?)';
    db.run(sql, [connection_id, passenger_name], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": {
                id: this.lastID,
                connection_id,
                passenger_name
            }
        });
    });
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
    const sql = `
        SELECT b.id, b.passenger_name, b.booking_date, 
               c.departure_time, c.arrival_time, c.price,
               s1.name as from_station_name, 
               s2.name as to_station_name
        FROM bookings b
        JOIN connections c ON b.connection_id = c.id
        JOIN stations s1 ON c.from_station_id = s1.id
        JOIN stations s2 ON c.to_station_id = s2.id
        ORDER BY b.booking_date DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
