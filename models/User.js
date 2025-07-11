const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    street: { type: String, default: '' },
    barangay: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'Philippines' }
  },
  profilePicture: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better query performance
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);
