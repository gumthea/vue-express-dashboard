const db = require('../config/db');

const isAdmin = async (req, res, next) => {
  const [roles] = await db.query('SELECT name FROM roles WHERE id = ?', [req.user.roleId]);
  if (!roles.length || roles[0].name !== 'admin') {
    return res.status(403).json({ message: 'Hanya admin yang diizinkan' });
  }
  next();
};

module.exports = isAdmin;
