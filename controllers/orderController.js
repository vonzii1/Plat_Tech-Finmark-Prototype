const Order = require('../models/Order');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Create new order
exports.createOrder = async (req, res) => {
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
      customerInfo,
      items,
      shippingAddress,
      notes
    } = req.body;

    const userId = req.user.id;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.'
      });
    }

    // Validate and process each item
    const processedItems = [];
    let orderTotal = 0;

    for (const item of items) {
      // Validate required fields
      if (!item.productId || !item.productName || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have productId, productName, quantity, and unitPrice.'
        });
      }

      // Validate quantity
      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0.'
        });
      }

      // Validate unit price
      if (item.unitPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Unit price cannot be negative.'
        });
      }

      // Check product availability
      const product = await Product.findOne({ productId: item.productId, isActive: true });
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productName} is not available.`
        });
      }

      // Check stock availability
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName}. Available: ${product.stockQuantity}`
        });
      }

      // Calculate item total
      const itemTotal = item.quantity * item.unitPrice;
      orderTotal += itemTotal;

      processedItems.push({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal
      });

      // Update product stock
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    // Create order
    const order = new Order({
      userId,
      customerInfo,
      items: processedItems,
      orderTotal,
      shippingAddress,
      notes: notes?.trim(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await order.save();

    // Populate user info for response
    await order.populate('userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: { order }
    });

  } catch (error) {
    console.error('Create order error:', error);

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
      message: 'Server error while creating order. Please try again.'
    });
  }
};

// Get all orders for current user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { userId };
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'firstName lastName email');

    // Get total count
    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limitNum),
          totalOrders: total,
          hasNextPage: skip + limitNum < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders.'
    });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('userId', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('Get order by ID error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching order.'
    });
  }
};

// Update order status (admin/manager only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status.'
      });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status.'
      });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Update order
    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (notes) updateData.notes = notes.trim();

    // Set actual delivery date if status is delivered
    if (status === 'delivered') {
      updateData.actualDelivery = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Order updated successfully.',
      data: { order: updatedOrder }
    });

  } catch (error) {
    console.error('Update order status error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating order.'
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Find order
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in its current status.'
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findOne({ productId: item.productId });
      if (product) {
        product.stockQuantity += item.quantity;
        await product.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      data: { order }
    });

  } catch (error) {
    console.error('Cancel order error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order.'
    });
  }
};

// Get order statistics (admin/manager only)
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get statistics
    const totalOrders = await Order.countDocuments(dateFilter);
    const totalRevenue = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$orderTotal' } } }
    ]);

    const statusStats = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const paymentStats = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: statusStats,
        paymentBreakdown: paymentStats
      }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order statistics.'
    });
  }
}; 