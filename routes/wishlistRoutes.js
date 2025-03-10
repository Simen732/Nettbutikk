const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, wishlistController.getWishlist);
router.post('/add', verifyToken, wishlistController.addToWishlist);
router.post('/remove/:itemId', verifyToken, wishlistController.removeFromWishlist);
router.post('/clear', verifyToken, wishlistController.clearWishlist);

exports.wishlistRoutes = router;