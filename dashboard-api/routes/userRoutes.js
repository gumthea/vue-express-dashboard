const express = require('express');
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', verifyToken, isAdmin, getAllUsers);
router.post('/', verifyToken, isAdmin, createUser);
router.put('/:id', verifyToken, isAdmin, updateUser);
router.delete('/:id', verifyToken, isAdmin, deleteUser);

module.exports = router;
