const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories
} = require('../controllers/productController');

// Validation rules
const createProductValidation = [
  body('productId')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Product ID must be between 3 and 20 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Product ID can only contain uppercase letters, numbers, and hyphens'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Product description must be between 10 and 500 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('minStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  body('specifications')
    .optional()
    .isObject()
    .withMessage('Specifications must be an object'),
  body('supplier.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  body('supplier.contact')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Supplier contact must be between 5 and 100 characters')
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Product description must be between 10 and 500 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('minStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  body('specifications')
    .optional()
    .isObject()
    .withMessage('Specifications must be an object'),
  body('supplier.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  body('supplier.contact')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Supplier contact must be between 5 and 100 characters')
];

const updateStockValidation = [
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('minStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer')
];

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/inventory/low-stock', auth, requireRole(['admin', 'manager']), getLowStockProducts);
router.get('/:productId', getProductById);

// Protected routes (admin/manager only)
router.post('/', auth, requireRole(['admin', 'manager']), createProductValidation, handleValidationErrors, createProduct);
router.put('/:productId', auth, requireRole(['admin', 'manager']), updateProductValidation, handleValidationErrors, updateProduct);
router.delete('/:productId', auth, requireRole(['admin', 'manager']), deleteProduct);
router.put('/:productId/stock', auth, requireRole(['admin', 'manager']), updateStockValidation, handleValidationErrors, updateStock);

module.exports = router; 