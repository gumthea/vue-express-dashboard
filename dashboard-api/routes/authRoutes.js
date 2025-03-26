const express = require('express');
const { login, logout } = require('../controllers/authController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/logout', verifyToken, logout);

module.exports = router;
