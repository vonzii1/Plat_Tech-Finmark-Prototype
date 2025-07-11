const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword,
  getAllUsers
} = require('../controllers/authController');
const { requireRole } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'manager'])
    .withMessage('Invalid role specified')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'manager'])
    .withMessage('Invalid role specified'),
  // Custom validation for phone/address only for users
  body('phone').custom((value, { req }) => {
    if ((req.user.role === 'user' || req.body.role === 'user')) {
      if (!value) throw new Error('Phone is required');
      if (!/^((\+63)|0)9\d{9}$/.test(value)) throw new Error('Please enter a valid Philippine phone number');
    }
    return true;
  }),
  body('address.street').custom((value, { req }) => {
    if ((req.user.role === 'user' || req.body.role === 'user')) {
      if (!value || value.length < 2 || value.length > 100) throw new Error('Street address must be between 2 and 100 characters');
    }
    return true;
  }),
  body('address.barangay').custom((value, { req }) => {
    if ((req.user.role === 'user' || req.body.role === 'user')) {
      if (!value || value.length < 2 || value.length > 100) throw new Error('Barangay must be between 2 and 100 characters');
    }
    return true;
  }),
  body('address.city').custom((value, { req }) => {
    if ((req.user.role === 'user' || req.body.role === 'user')) {
      if (!value || value.length < 2 || value.length > 100) throw new Error('City/Municipality must be between 2 and 100 characters');
    }
    return true;
  }),
  body('address.province').custom((value, { req }) => {
    if ((req.user.role === 'user' || req.body.role === 'user')) {
      if (!value || value.length < 2 || value.length > 100) throw new Error('Province must be between 2 and 100 characters');
    }
    return true;
  }),
  body('address.zipCode').custom((value, { req }) => {
    if ((req.user.role === 'user' || req.body.role === 'user')) {
      if (!value || !/^\d{4}$/.test(value)) throw new Error('ZIP Code must be 4 digits');
    }
    return true;
  }),
  body('address.country').custom((value, { req }) => {
    if ((req.user.role === 'user' || req.body.role === 'user')) {
      if (!value || value.length < 2 || value.length > 100) throw new Error('Country must be between 2 and 100 characters');
    }
    return true;
  }),
  body('profilePicture')
    .optional()
    .isString()
    .withMessage('Profile picture must be a valid string')
    .isLength({ max: 10000000 }) // Max 10MB base64 string
    .withMessage('Profile picture is too large')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfileValidation, handleValidationErrors, updateProfile);
router.put('/change-password', auth, changePasswordValidation, handleValidationErrors, changePassword);
router.get('/users', auth, requireRole(['admin']), getAllUsers);

module.exports = router;
