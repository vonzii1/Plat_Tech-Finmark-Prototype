const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock level cannot be negative'],
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  supplier: {
    name: {
      type: String,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProductSchema.index({ productId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ stockQuantity: 1 });

// Virtual for checking if product is in stock
ProductSchema.virtual('inStock').get(function() {
  return this.stockQuantity > 0;
});

// Virtual for checking if stock is low
ProductSchema.virtual('lowStock').get(function() {
  return this.stockQuantity <= this.minStockLevel;
});

// Ensure virtual fields are serialized
ProductSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema); 