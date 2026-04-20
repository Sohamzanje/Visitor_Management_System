const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../')); // Serve frontend files

// SQLite database setup
const db = new sqlite3.Database('./visitor_system.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initTables();
    }
});

// Simple token storage (in production, use Redis or database)
const adminTokens = new Map();

// Authentication middleware
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    if (!adminTokens.has(token)) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.admin = adminTokens.get(token);
    next();
}

function initTables() {
    // Create visitors table
    db.run(`
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            company TEXT,
            purpose TEXT NOT NULL,
            visit_date TEXT NOT NULL,
            check_in_time TEXT NOT NULL,
            remarks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating visitors table:', err.message);
        }
    });

    // Create admins table
    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating admins table:', err.message);
        } else {
            console.log('Database tables ready.');
        }
    });
}

// Routes

app.get('/api/visitors', (req, res) => {
    const sql = 'SELECT id, name, phone, email, company, purpose, visit_date, check_in_time, remarks, created_at FROM visitors ORDER BY created_at DESC';

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/visitors', (req, res) => {
    const { name, phone, email, company, purpose, visitDate, checkInTime, remarks } = req.body;

    if (!name || !phone || !email || !purpose || !visitDate || !checkInTime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = 'INSERT INTO visitors (name, phone, email, company, purpose, visit_date, check_in_time, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    db.run(sql, [name, phone, email, company || '', purpose, visitDate, checkInTime, remarks || ''], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Visitor added successfully' });
    });
});

app.delete('/api/visitors/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM visitors WHERE id = ?';

    db.run(sql, id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Visitor not found' });
            return;
        }
        res.json({ message: 'Visitor deleted successfully' });
    });
});

app.put('/api/visitors/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, email, company, purpose, visitDate, checkInTime, remarks } = req.body;

    const sql = 'UPDATE visitors SET name = ?, phone = ?, email = ?, company = ?, purpose = ?, visit_date = ?, check_in_time = ?, remarks = ? WHERE id = ?';

    db.run(sql, [name, phone, email, company || '', purpose, visitDate, checkInTime, remarks || '', id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Visitor not found' });
            return;
        }
        res.json({ message: 'Visitor updated successfully' });
    });
});

// Admin routes
app.get('/api/admin/check', (req, res) => {
    const sql = 'SELECT COUNT(*) as count FROM admins';

    db.get(sql, [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ exists: row.count > 0 });
    });
});

app.post('/api/admin/signup', (req, res) => {
    const { username, password, name, email } = req.body;

    if (!username || !password || !name || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if admin already exists
    db.get('SELECT id FROM admins LIMIT 1', [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            return res.status(400).json({ error: 'Admin account already exists' });
        }

        // Hash password (simple hash for demo - use bcrypt in production)
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        const sql = 'INSERT INTO admins (username, password_hash, name, email) VALUES (?, ?, ?, ?)';

        db.run(sql, [username, passwordHash, name, email], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Username already exists' });
                } else {
                    res.status(500).json({ error: err.message });
                }
                return;
            }
            res.json({ message: 'Admin account created successfully', id: this.lastID });
        });
    });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const sql = 'SELECT id, username, password_hash, name, email FROM admins WHERE username = ?';

    db.get(sql, [username], (err, admin) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!admin) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        if (passwordHash !== admin.password_hash) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        adminTokens.set(token, {
            id: admin.id,
            username: admin.username,
            name: admin.name,
            email: admin.email
        });

        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                name: admin.name,
                email: admin.email
            }
        });
    });
});

// Protected visitor routes for admin
app.get('/api/admin/visitors', authenticateAdmin, (req, res) => {
    const sql = 'SELECT * FROM visitors ORDER BY created_at DESC';

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.delete('/api/admin/visitors/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM visitors WHERE id = ?';

    db.run(sql, id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Visitor not found' });
            return;
        }
        res.json({ message: 'Visitor deleted successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    console.log('Server shutting down gracefully.');
    process.exit(0);
});