const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, inStock } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { productId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (inStock === 'true') {
      query.stockQuantity = { $gt: 0 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get products with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limitNum),
          totalProducts: total,
          hasNextPage: skip + limitNum < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products.'
    });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({ productId, isActive: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: { product }
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product.'
    });
  }
};

// Create new product (admin/manager only)
exports.createProduct = async (req, res) => {
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

    const {
      productId,
      name,
      description,
      category,
      price,
      stockQuantity,
      minStockLevel,
      images,
      specifications,
      supplier
    } = req.body;

    // Check if product ID already exists
    const existingProduct = await Product.findOne({ productId });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product ID already exists.'
      });
    }

    // Create new product
    const product = new Product({
      productId: productId.trim(),
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity) || 0,
      minStockLevel: parseInt(minStockLevel) || 10,
      images: images || [],
      specifications: specifications || {},
      supplier: supplier || {}
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { product }
    });

  } catch (error) {
    console.error('Create product error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product ID already exists.'
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
      message: 'Server error while creating product.'
    });
  }
};

// Update product (admin/manager only)
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    // Find product
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Update product
    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: { product: updatedProduct }
    });

  } catch (error) {
    console.error('Update product error:', error);

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
      message: 'Server error while updating product.'
    });
  }
};

// Delete product (admin/manager only)
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find product
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product.'
    });
  }
};

// Update product stock (admin/manager only)
exports.updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { stockQuantity, minStockLevel } = req.body;

    // Validate input
    if (stockQuantity !== undefined && stockQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity cannot be negative.'
      });
    }

    if (minStockLevel !== undefined && minStockLevel < 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimum stock level cannot be negative.'
      });
    }

    // Find and update product
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    if (stockQuantity !== undefined) {
      product.stockQuantity = stockQuantity;
    }

    if (minStockLevel !== undefined) {
      product.minStockLevel = minStockLevel;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product stock updated successfully.',
      data: { product }
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product stock.'
    });
  }
};

// Get low stock products (admin/manager only)
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }
    }).sort({ stockQuantity: 1 });

    res.status(200).json({
      success: true,
      data: { products }
    });

  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching low stock products.'
    });
  }
};

// Get product categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories.'
    });
  }
}; 