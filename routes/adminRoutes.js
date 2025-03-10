const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'username');
    
    res.render('admin/dashboard', {
      productCount,
      orderCount,
      recentOrders
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).render('error', { message: 'Failed to load admin dashboard' });
  }
});

// Product management
router.get('/products', verifyToken, isAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('admin/products', { products });
  } catch (error) {
    console.error('Error fetching products for admin:', error);
    res.status(500).render('error', { message: 'Failed to fetch products' });
  }
});

// Create product form
router.get('/products/create', verifyToken, isAdmin, (req, res) => {
  res.render('admin/create-product');
});

// Edit product form
router.get('/products/edit/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).render('error', { message: 'Product not found' });
    }
    
    res.render('admin/edit-product', { product });
  } catch (error) {
    console.error('Error fetching product for edit:', error);
    res.status(500).render('error', { message: 'Failed to fetch product details' });
  }
});

// Order management
router.get('/orders', verifyToken, isAdmin, orderController.getAllOrders);

exports.adminRoutes = router;