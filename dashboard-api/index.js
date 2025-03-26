const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./config/db');
const sendToKafka = require('./config/kafka');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

// Konfigurasi CORS
app.use(cors({
  origin: 'http://localhost:5173', // Izinkan origin frontend Anda
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Izinkan metode yang dibutuhkan
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

// Middleware untuk cek role admin
const isAdmin = async (req, res, next) => {
  const [roles] = await db.query('SELECT name FROM roles WHERE id = ?', [req.user.roleId]);
  if (roles.length === 0 || roles[0].name !== 'admin') {
    return res.status(403).json({ message: 'Hanya admin yang diizinkan' });
  }
  next();
};

// Endpoint Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Validasi input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password diperlukan' });
    }

    // Ambil data pengguna dari database
    const [users] = await db.query('SELECT id, username, password, role_id FROM users WHERE username = ?', [username]);
    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Login gagal: Pengguna tidak ditemukan' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password); // Verifikasi password dengan bcrypt
    if (!isMatch) {
      return res.status(401).json({ message: 'Login gagal: Password salah' });
    }

    const userId = user.id;
    const roleId = user.role_id;
    const token = jwt.sign({ userId, username, roleId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Nonaktifkan sesi lama
    await db.query('UPDATE sessions SET status = "inactive" WHERE user_id = ?', [userId]);
    // Catat sesi baru
    await db.query(
      'INSERT INTO sessions (user_id, token, status) VALUES (?, ?, ?)',
      [userId, token, 'active']
    );

    // Catat audit trail
    await logAuditTrail(userId, username, 'LOGIN', { message: 'User logged in', timestamp: new Date() });

    res.json({ token });
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
  const { userId, username, roleId } = req.user;
  const [roles] = await db.query('SELECT name FROM roles WHERE id = ?', [roleId]);
  const role = roles[0].name;
  if (role === 'admin' || role === 'editor' || role === 'viewer') {
    await logAuditTrail(userId, username, 'ACCESS_DASHBOARD', { message: 'Accessed dashboard data' });
    res.json({ message: 'Data dashboard', data: [] });
  } else {
    res.status(403).json({ message: 'Akses ditolak' });
  }
});

// Endpoint Audit Trail
app.get('/audit-trail', verifyToken, async (req, res) => {
  const { userId, username, roleId } = req.user;
  const [roles] = await db.query('SELECT name FROM roles WHERE id = ?', [roleId]);
  const role = roles[0].name;
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

// CRUD Users
// Create User
app.post('/users', verifyToken, isAdmin, async (req, res) => {
  const { username, password, roleId } = req.body;
  try {
    // Validasi input
    if (!username || !password || !roleId) {
      return res.status(400).json({ message: 'Username, password, dan role tidak boleh kosong' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // Cek username unik
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    await db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, roleId]);
    const [user] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    await logAuditTrail(req.user.userId, req.user.username, 'CREATE_USER', { userId: user[0].id, username, roleId });
    res.status(201).json({ message: 'Pengguna berhasil dibuat' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read All Users
app.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, role_id FROM users');
    await logAuditTrail(req.user.userId, req.user.username, 'READ_USERS', { message: 'Viewed all users' });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User
app.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, password, roleId } = req.body;
  try {
    // Validasi input
    if (!username && !password && !roleId) {
      return res.status(400).json({ message: 'Setidaknya satu field (username, password, atau role) harus diisi' });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // Cek username unik (jika diubah)
    if (username) {
      const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Username sudah digunakan oleh pengguna lain' });
      }
    }

    const updates = {};
    if (username) updates.username = username;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (roleId) updates.role_id = roleId;

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    await db.query(`UPDATE users SET ${fields} WHERE id = ?`, values);
    await logAuditTrail(req.user.userId, req.user.username, 'UPDATE_USER', { userId: id, updates });
    res.json({ message: 'Pengguna berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete User
app.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    await logAuditTrail(req.user.userId, req.user.username, 'DELETE_USER', { userId: id });
    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD Roles
// Read All Roles
app.get('/roles', verifyToken, async (req, res) => {
  try {
    const [roles] = await db.query('SELECT id, name, description FROM roles');
    const [rolePermissions] = await db.query('SELECT role_id, permission_id FROM role_permissions');
    const rolesWithPermissions = roles.map(role => ({
      ...role,
      permissions: rolePermissions.filter(rp => rp.role_id === role.id).map(rp => rp.permission_id),
    }));
    res.json(rolesWithPermissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Role
app.post('/roles', verifyToken, isAdmin, async (req, res) => {
  const { name, description, permissions } = req.body;
  try {
    if (!name) return res.status(400).json({ message: 'Nama role tidak boleh kosong' });
    const [existing] = await db.query('SELECT id FROM roles WHERE name = ?', [name]);
    if (existing.length > 0) return res.status(400).json({ message: 'Nama role sudah digunakan' });
    const [result] = await db.query('INSERT INTO roles (name, description) VALUES (?, ?)', [name, description || null]);
    const roleId = result.insertId;
    if (permissions && permissions.length > 0) {
      const values = permissions.map(permissionId => [roleId, permissionId]);
      await db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
    }
    res.status(201).json({ message: 'Role berhasil dibuat' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Role
app.put('/roles/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;
  try {
    if (!name) return res.status(400).json({ message: 'Nama role tidak boleh kosong' });
    const [existing] = await db.query('SELECT id FROM roles WHERE name = ? AND id != ?', [name, id]);
    if (existing.length > 0) return res.status(400).json({ message: 'Nama role sudah digunakan' });
    await db.query('UPDATE roles SET name = ?, description = ? WHERE id = ?', [name, description || null, id]);
    await db.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
    if (permissions && permissions.length > 0) {
      const values = permissions.map(permissionId => [id, permissionId]);
      await db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
    }
    res.json({ message: 'Role berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Role
app.delete('/roles/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [users] = await db.query('SELECT id FROM users WHERE role_id = ?', [id]);
    if (users.length > 0) return res.status(400).json({ message: 'Role tidak bisa dihapus karena masih digunakan oleh pengguna' });
    await db.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
    await db.query('DELETE FROM roles WHERE id = ?', [id]);
    res.json({ message: 'Role berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk Permissions
app.get('/permissions', verifyToken, isAdmin, async (req, res) => {
  try {
    const [permissions] = await db.query('SELECT id, name, description FROM permissions');
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => console.log('Server berjalan di port: ' + process.env.PORT));
