const express = require('express');
const { getAllRoles, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', verifyToken, getAllRoles);
router.post('/', verifyToken, isAdmin, createRole);
router.put('/:id', verifyToken, isAdmin, updateRole);
router.delete('/:id', verifyToken, isAdmin, deleteRole);

module.exports = router;
