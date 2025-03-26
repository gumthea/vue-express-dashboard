const express = require('express');
const { getAllPermissions } = require('../controllers/permissionController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, getAllPermissions);

module.exports = router;
