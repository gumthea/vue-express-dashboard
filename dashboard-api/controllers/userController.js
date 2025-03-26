const db = require('../config/db');
const bcrypt = require('bcrypt');
const logAuditTrail = require('../utils/auditLogger');

const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, role_id FROM users');
    await logAuditTrail(req.user.userId, req.user.username, 'READ_USERS', { message: 'Viewed all users' });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createUser = async (req, res) => {
  const { username, password, roleId } = req.body;
  try {
    if (!username || !password || !roleId) {
      return res.status(400).json({ message: 'Username, password, dan role tidak boleh kosong' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)', [username, hashedPassword, roleId]);
    const [user] = await db.query('SELECT id FROM users WHERE username = ?', [username]);

    await logAuditTrail(req.user.userId, req.user.username, 'CREATE_USER', { userId: user[0].id, username, roleId });
    res.status(201).json({ message: 'Pengguna berhasil dibuat' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, password, roleId } = req.body;
  try {
    if (!username && !password && !roleId) {
      return res.status(400).json({ message: 'Setidaknya satu field harus diisi' });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

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
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    await logAuditTrail(req.user.userId, req.user.username, 'DELETE_USER', { userId: id });

    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser };
