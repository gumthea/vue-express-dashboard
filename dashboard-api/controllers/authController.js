const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const logAuditTrail = require('../utils/auditLogger');

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.query('SELECT id, username, password, role_id FROM users WHERE username = ?', [username]);
    if (!users.length) return res.status(401).json({ message: 'Pengguna tidak ditemukan' });

    const user = users[0];
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Password salah' });
    }

    const token = jwt.sign({ userId: user.id, username, roleId: user.role_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await db.query('UPDATE sessions SET status = "inactive" WHERE user_id = ?', [user.id]);
    await db.query('INSERT INTO sessions (user_id, token, status) VALUES (?, ?, ?)', [user.id, token, 'active']);
    await logAuditTrail(user.id, username, 'LOGIN', { message: 'User logged in' });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  const { userId, username } = req.user;
  const token = req.headers['authorization'].split(' ')[1];

  try {
    await db.query('UPDATE sessions SET status = ? WHERE user_id = ? AND token = ?', ['inactive', userId, token]);
    await logAuditTrail(userId, username, 'LOGOUT', { message: 'User logged out' });
    res.json({ message: 'Logout berhasil' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, logout };
