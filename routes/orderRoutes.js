const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/', verifyToken, orderController.createOrder);
router.get('/myorders', verifyToken, orderController.getMyOrders);
router.get('/:id', verifyToken, orderController.getOrderById);

// Admin routes
router.get('/', verifyToken, isAdmin, orderController.getAllOrders);
router.post('/:id/status', verifyToken, isAdmin, orderController.updateOrderStatus);

exports.orderRoutes = router;