const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sakshi@123',
    database: 'skill_barter'
});

db.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL');
});

/* ========== API Routes ========== */

// 🔹 Register User (without profile image)
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, email, password, connections_count) VALUES (?, ?, ?, 0)';
        db.query(sql, [username, email, hashedPassword], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Email already exists' });
                }
                console.error('❌ Registration error:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (err) {
        console.error('❌ Hash error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🔹 User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid email or password' });

        res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

// 🔹 Post a Skill
app.post('/api/post-skill', (req, res) => {
    const { skillName, yourName, description, courseDuration } = req.body;

    if (!skillName || !yourName || !description || !courseDuration) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = 'INSERT INTO skills (skillName, yourName, description, courseDuration) VALUES (?, ?, ?, ?)';
    db.query(sql, [skillName, yourName, description, courseDuration], (err) => {
        if (err) {
            console.error("❌ Database Insert Error:", err);
            return res.status(500).json({ error: 'Database error' });
        }

        db.query('SELECT COUNT(*) AS count FROM skills', (err, countResult) => {
            if (err) {
                console.error("❌ Count Fetch Error:", err);
                return res.status(500).json({ error: 'Error fetching skill count' });
            }

            res.status(201).json({ message: 'Skill added successfully', count: countResult[0].count });
        });
    });
});

// 🔹 Get All Skills
app.get('/api/skills', (req, res) => {
    db.query('SELECT * FROM skills', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 🔹 Send Connection Request
app.post('/api/send-connection', (req, res) => {
    const { senderUsername, receiverUsername } = req.body;

    if (!senderUsername || !receiverUsername || senderUsername === receiverUsername) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const sqlSender = 'SELECT id FROM users WHERE username = ?';
    db.query(sqlSender, [senderUsername], (err, senderResult) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch sender ID' });
        if (senderResult.length === 0) return res.status(404).json({ error: 'Sender not found' });

        const senderId = senderResult[0].id;

        const sqlReceiver = 'SELECT id FROM users WHERE username = ?';
        db.query(sqlReceiver, [receiverUsername], (err, receiverResult) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch receiver ID' });
            if (receiverResult.length === 0) return res.status(404).json({ error: 'Receiver not found' });

            const receiverId = receiverResult[0].id;

            const checkSql = 'SELECT * FROM connections WHERE sender = ? AND receiver = ? AND status IN ("pending", "accepted")';
            db.query(checkSql, [senderId, receiverId], (err, existing) => {
                if (err) return res.status(500).json({ error: 'Error checking existing request' });
                if (existing.length > 0) {
                    return res.status(400).json({ error: 'Connection request already exists' });
                }

                const sqlInsert = 'INSERT INTO connections (sender, receiver, status) VALUES (?, ?, "pending")';
                db.query(sqlInsert, [senderId, receiverId], (err) => {
                    if (err) return res.status(500).json({ error: 'Failed to send request' });
                    res.json({ message: 'Connection request sent' });
                });
            });
        });
    });
});

// 🔹 Get Incoming Connection Requests
app.get('/api/get-incoming-requests/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT connections.id, connections.sender, users.username AS senderUsername, connections.status 
        FROM connections 
        JOIN users ON connections.sender = users.id 
        WHERE connections.receiver = ? AND connections.status = 'pending'
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json(results);
    });
});

// 🔹 Respond to Connection Request (Accept or Reject)
app.put('/api/respond-connection', (req, res) => {
    const { id, status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const sql = 'SELECT sender, receiver FROM connections WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch connection details' });
        if (results.length === 0) return res.status(404).json({ error: 'Request not found' });

        const { sender, receiver } = results[0];

        const updateStatusSql = 'UPDATE connections SET status = ? WHERE id = ?';
        db.query(updateStatusSql, [status, id], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update status' });

            if (status === 'accepted') {
                const updateSenderCount = 'UPDATE users SET connections_count = connections_count + 1 WHERE id = ?';
                const updateReceiverCount = 'UPDATE users SET connections_count = connections_count + 1 WHERE id = ?';

                db.query(updateSenderCount, [sender], (err) => {
                    if (err) return res.status(500).json({ error: 'Failed to update sender count' });

                    db.query(updateReceiverCount, [receiver], (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to update receiver count' });

                        res.json({ message: 'Connection request ' + status });
                    });
                });
            } else {
                res.json({ message: 'Connection request ' + status });
            }
        });
    });
});

// 🔹 NEW: Profile Page API
app.get('/api/profile/:userId', (req, res) => {
    const userId = req.params.userId;

    const userQuery = 'SELECT id, username, email, connections_count FROM users WHERE id = ?';
    const skillsQuery = 'SELECT * FROM skills WHERE yourName = (SELECT username FROM users WHERE id = ?)';
    const requestsQuery = `
        SELECT connections.id, users.username AS senderUsername, connections.status
        FROM connections
        JOIN users ON connections.sender = users.id
        WHERE connections.receiver = ? AND connections.status = 'pending'
    `;

    db.query(userQuery, [userId], (err, userResult) => {
        if (err || userResult.length === 0) return res.status(500).json({ error: 'User not found' });

        const user = userResult[0];

        db.query(skillsQuery, [userId], (err, skillsResult) => {
            if (err) return res.status(500).json({ error: 'Error fetching skills' });

            db.query(requestsQuery, [userId], (err, requestsResult) => {
                if (err) return res.status(500).json({ error: 'Error fetching requests' });

                res.status(200).json({
                    user,
                    skills: skillsResult,
                    incomingRequests: requestsResult
                });
            });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
