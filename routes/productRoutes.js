const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Add this route before other routes
router.get('/search', productController.searchProducts);

// Public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);

// Admin routes (protected)
router.post('/', verifyToken, isAdmin, productController.createProduct);
router.post('/update/:id', verifyToken, isAdmin, productController.updateProduct);
router.post('/delete/:id', verifyToken, isAdmin, productController.deleteProduct);

exports.productRoutes = router;