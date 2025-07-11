const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getAllOrders
} = require('../controllers/orderController');

// Validation rules
const createOrderValidation = [
  body('customerInfo.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Customer first name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Customer first name can only contain letters and spaces'),
  body('customerInfo.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Customer last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Customer last name can only contain letters and spaces'),
  body('customerInfo.email')
    .isEmail()
    .withMessage('Please enter a valid customer email address')
    .normalizeEmail(),
  body('customerInfo.phone')
    .trim()
    .notEmpty()
    .withMessage('Customer phone number is required')
    .matches(/^[\+]?\d{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required for each item'),
  body('items.*.productName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const updateOrderStatusValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Routes
router.post('/', auth, createOrderValidation, handleValidationErrors, createOrder);
router.get('/', auth, getUserOrders);
router.get('/stats', auth, requireRole(['admin', 'manager']), getOrderStats);
router.get('/all', auth, requireRole(['admin', 'manager']), getAllOrders);
router.get('/:orderId', auth, getOrderById);
router.put('/:orderId/status', auth, requireRole(['admin', 'manager', 'staff']), updateOrderStatusValidation, handleValidationErrors, updateOrderStatus);
router.put('/:orderId/cancel', auth, cancelOrder);

module.exports = router; 