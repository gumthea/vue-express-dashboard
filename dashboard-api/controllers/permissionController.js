const db = require('../config/db');

const getAllPermissions = async (req, res) => {
  try {
    const [permissions] = await db.query('SELECT id, name, description FROM permissions');
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllPermissions };
