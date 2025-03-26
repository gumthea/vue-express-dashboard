const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token diperlukan' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [sessions] = await db.query(
      'SELECT status FROM sessions WHERE user_id = ? AND token = ?',
      [decoded.userId, token]
    );

    if (!sessions.length || sessions[0].status !== 'active') {
      return res.status(401).json({ message: 'Sesi tidak valid' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

module.exports = verifyToken;
