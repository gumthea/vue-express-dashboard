const db = require('../config/db');
const logAuditTrail = require('../utils/auditLogger');

const getAuditTrail = async (req, res) => {
  const { userId, username, roleId } = req.user;
  
  try {
    // Cek role pengguna
    const [roles] = await db.query('SELECT name FROM roles WHERE id = ?', [roleId]);
    const role = roles[0]?.name;

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang bisa melihat audit trail' });
    }

    // Pagination
    const { page = 1, limit = 10, startDate, endDate, action } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM audit_trail WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM audit_trail WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND timestamp >= ?';
      countQuery += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      countQuery += ' AND timestamp <= ?';
      params.push(endDate);
    }

    if (action) {
      query += ' AND action = ?';
      countQuery += ' AND action = ?';
      params.push(action);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    const [[{ total }]] = await db.query(countQuery, params);

    // Catat ke audit trail
    await logAuditTrail(userId, username, 'VIEW_AUDIT_TRAIL', { message: 'Viewed audit trail' });

    res.json({
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAuditTrail };
