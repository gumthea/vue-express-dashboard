const db = require('../config/db');

const getAllRoles = async (req, res) => {
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
};

const createRole = async (req, res) => {
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
};

const updateRole = async (req, res) => {
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
};

const deleteRole = async (req, res) => {
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
};

module.exports = { getAllRoles, createRole, updateRole, deleteRole };
