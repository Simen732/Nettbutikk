const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.get('/login', authController.renderLogin);
router.post('/login', authController.login);

router.get('/register', authController.renderRegister);
router.post('/register', authController.register);

// Profile routes
router.get('/profile', verifyToken, authController.renderProfile);
router.post('/profile', verifyToken, authController.updateProfile);
router.post('/change-password', verifyToken, authController.changePassword);

router.get('/logout', authController.logout); 

exports.authRoutes = router;