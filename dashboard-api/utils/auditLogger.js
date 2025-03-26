const db = require('../config/db');
const sendToKafka = require('../config/kafka');

const logAuditTrail = async (userId, username, action, details) => {
  await db.query(
    'INSERT INTO audit_trail (user_id, username, action, details) VALUES (?, ?, ?, ?)',
    [userId, username, action, JSON.stringify(details)]
  );
  sendToKafka('audit_trail', { userId, username, action, details, timestamp: new Date() });
};

module.exports = logAuditTrail;
