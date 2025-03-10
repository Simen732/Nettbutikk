const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).redirect('/auth/login');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).redirect('/auth/login');
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (user && user.role === 'admin') {
      next();
    } else {
      return res.status(403).render('error', { 
        message: 'Access denied. Admin privileges required.' 
      });
    }
  } catch (error) {
    res.status(500).render('error', { message: 'Server error' });
  }
};