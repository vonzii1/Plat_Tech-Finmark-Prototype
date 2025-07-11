const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Register new user
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: errorMessages
      });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role || 'user'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email.'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: errorMessages
      });
    }

  const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile.'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    // Check if email is being changed and if it already exists
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists. Please use a different email.'
        });
      }
    }

    // Update user
    const updateFields = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: email?.toLowerCase()
    };
    if (req.body.phone !== undefined) updateFields.phone = req.body.phone;
    if (req.body.address !== undefined) updateFields.address = req.body.address;
    if (req.body.profilePicture !== undefined) updateFields.profilePicture = req.body.profilePicture;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email.'
      });
    }

    if (error.name === 'ValidationError' || error.errors) {
      const errors = (error.errors ? Object.values(error.errors) : []).map(err => ({
        field: err.path,
        message: err.message
      }));
      console.error('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile.'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password.'
    });
  }
};

// Add at the end of the file
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive } = req.body;
    const userId = req.params.id;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists. Please use a different email.'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        email: email?.toLowerCase(),
        role,
        isActive
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating user.',
      error: error.message
    });
  }
};

// --- Shipping Address Management ---

// Get all shipping addresses for current user
exports.getShippingAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, addresses: user.shippingAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching addresses.' });
  }
};

// Add a new shipping address (max 2)
exports.addShippingAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.shippingAddresses.length >= 2) {
      return res.status(400).json({ success: false, message: 'You can only have up to 2 shipping addresses.' });
    }
    user.shippingAddresses.push(req.body);
    await user.save();
    res.status(201).json({ success: true, addresses: user.shippingAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while adding address.' });
  }
};

// Update a shipping address by index
exports.updateShippingAddress = async (req, res) => {
  try {
    const { index } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (index < 0 || index >= user.shippingAddresses.length) {
      return res.status(400).json({ success: false, message: 'Invalid address index.' });
    }
    user.shippingAddresses[index] = req.body;
    await user.save();
    res.status(200).json({ success: true, addresses: user.shippingAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while updating address.' });
  }
};

// Delete a shipping address by index
exports.deleteShippingAddress = async (req, res) => {
  try {
    const { index } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (index < 0 || index >= user.shippingAddresses.length) {
      return res.status(400).json({ success: false, message: 'Invalid address index.' });
    }
    user.shippingAddresses.splice(index, 1);
    await user.save();
    res.status(200).json({ success: true, addresses: user.shippingAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while deleting address.' });
  }
};
