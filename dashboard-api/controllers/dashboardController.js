const db = require('../config/db');
const logAuditTrail = require('../utils/auditLogger');

const getDashboardData = async (req, res) => {
  const { userId, username, roleId } = req.user;

  try {
    const [roles] = await db.query('SELECT name FROM roles WHERE id = ?', [roleId]);
    if (roles.length === 0) {
      return res.status(404).json({ message: 'Role tidak ditemukan' });
    }

    const role = roles[0].name;
    if (['admin', 'editor', 'viewer'].includes(role)) {
      await logAuditTrail(userId, username, 'ACCESS_DASHBOARD', { message: 'Accessed dashboard data' });

      // Tambahkan logika pengambilan data dashboard di sini
      const dashboardData = {}; // Ganti dengan query atau perhitungan data dashboard

      res.json({ message: 'Data dashboard', data: dashboardData });
    } else {
      res.status(403).json({ message: 'Akses ditolak' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDashboardData };
