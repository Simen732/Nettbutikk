const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, cartController.getCart);
router.post('/add', verifyToken, cartController.addToCart);
router.post('/update/:itemId', verifyToken, cartController.updateCartItem);
router.post('/remove/:itemId', verifyToken, cartController.removeFromCart);
router.post('/clear', verifyToken, cartController.clearCart);
router.get('/checkout', verifyToken, cartController.getCheckout);

exports.cartRoutes = router;