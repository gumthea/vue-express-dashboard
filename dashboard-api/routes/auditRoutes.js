const express = require('express');
const { getAuditTrail } = require('../controllers/auditController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, getAuditTrail);

module.exports = router;
