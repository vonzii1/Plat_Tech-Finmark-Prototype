const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { getAllUsers, updateUser } = require('../controllers/authController');

// GET /api/users - List all users (admin only)
router.get('/', auth, requireRole(['admin']), getAllUsers);
// PUT /api/users/:id - Update user (admin only)
router.put('/:id', auth, requireRole(['admin']), updateUser);

module.exports = router; 