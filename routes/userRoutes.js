const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { getAllUsers, updateUser, getShippingAddresses, addShippingAddress, updateShippingAddress, deleteShippingAddress } = require('../controllers/authController');

// GET /api/users - List all users (admin only)
router.get('/', auth, requireRole(['admin']), getAllUsers);
// PUT /api/users/:id - Update user (admin only)
router.put('/:id', auth, requireRole(['admin']), updateUser);
// Shipping address management (authenticated user)
router.get('/shipping-addresses', auth, getShippingAddresses);
router.post('/shipping-addresses', auth, addShippingAddress);
router.put('/shipping-addresses/:index', auth, updateShippingAddress);
router.delete('/shipping-addresses/:index', auth, deleteShippingAddress);

module.exports = router; 