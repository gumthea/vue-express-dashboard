const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./db');
const sendToKafka = require('./kafka');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Konfigurasi CORS
app.use(cors({
  origin: 'http://localhost:5173', // Izinkan origin frontend Anda
  methods: ['GET', 'POST'], // Izinkan metode yang dibutuhkan
  allowedHeaders: ['Content-Type', 'Authorization'], // Izinkan header yang digunakan
}));

app.use(express.json());

// Fungsi untuk mencatat audit trail
const logAuditTrail = async (userId, username, action, details) => {
  try {
    await db.query(
      'INSERT INTO audit_trail (user_id, username, action, details) VALUES (?, ?, ?, ?)',
      [userId, username, action, JSON.stringify(details)]
    );
    sendToKafka('audit_trail', { userId, username, action, details, timestamp: new Date() });
  } catch (err) {
    console.error('Gagal mencatat audit trail:', err);
  }
};

// Middleware untuk verifikasi token dan sesi
const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token diperlukan' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [sessions] = await db.query(
      'SELECT status FROM sessions WHERE user_id = ? AND token = ?',
      [decoded.userId, token]
    );
    if (sessions.length === 0 || sessions[0].status !== 'active') {
      return res.status(401).json({ message: 'Sesi tidak valid atau telah logout' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Endpoint Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan password diperlukan' });
        }

        await db.query('CALL sp_login(?, ?, @status, @role)', [username, password]);
        const [result] = await db.query('SELECT @status AS status, @role AS role');
        const { status, role } = result[0];
  
        if (status === 1) {
            const [user] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
            if (!user || !user.length) {
            return res.status(500).json({ message: 'Pengguna tidak ditemukan di database' });
            }
            const userId = user[0].id;
    
            const token = jwt.sign({ userId, username, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
            // Nonaktifkan sesi lama (opsional)
            await db.query('UPDATE sessions SET status = "inactive" WHERE user_id = ?', [userId]);
            // Catat sesi baru
            await db.query(
            'INSERT INTO sessions (user_id, token, status) VALUES (?, ?, ?)',
            [userId, token, 'active']
            );
    
            // Catat audit trail (sudah termasuk Kafka di dalam logAuditTrail)
            await logAuditTrail(userId, username, 'LOGIN', { message: 'User logged in', timestamp: new Date() });
    
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Login gagal' });
        }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// Endpoint Logout
app.post('/logout', verifyToken, async (req, res) => {
  const { userId, username } = req.user;
  const token = req.headers['authorization'].split(' ')[1];

  try {
    await db.query(
      'UPDATE sessions SET status = ? WHERE user_id = ? AND token = ?',
      ['inactive', userId, token]
    );
    await logAuditTrail(userId, username, 'LOGOUT', { message: 'User logged out' });
    res.json({ message: 'Logout berhasil' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Dashboard Data
app.get('/dashboard-data', verifyToken, async (req, res) => {
  const { userId, username, role } = req.user;
  if (role === 'admin' || role === 'editor') {
    await logAuditTrail(userId, username, 'ACCESS_DASHBOARD', { message: 'Accessed dashboard data' });
    res.json({ message: 'Data dashboard untuk admin/editor', data: [] });
  } else {
    res.status(403).json({ message: 'Akses ditolak' });
  }
});

// Endpoint Audit Trail
app.get('/audit-trail', verifyToken, async (req, res) => {
  const { role, userId, username } = req.user;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Hanya admin yang bisa melihat audit trail' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM audit_trail ORDER BY timestamp DESC');
    await logAuditTrail(userId, username, 'VIEW_AUDIT_TRAIL', { message: 'Viewed audit trail' });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => console.log('Server berjalan di port: ' + process.env.PORT));
