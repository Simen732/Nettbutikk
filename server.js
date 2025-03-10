require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const { authRoutes } = require('./routes/authRoutes');
const { productRoutes } = require('./routes/productRoutes');
const { cartRoutes } = require('./routes/cartRoutes');
const { orderRoutes } = require('./routes/orderRoutes');
const { adminRoutes } = require('./routes/adminRoutes');

app.set('view engine', 'ejs');
// Fix the path to use correct case sensitivity - 'Views' instead of 'views'
app.set('views', path.join(__dirname, 'Views'));

// Set up cookie-parser BEFORE trying to access cookies
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// AFTER cookie-parser, now you can check tokens
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.locals.user = decoded;
    } catch (err) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// Middleware to add cart count to locals for views
app.use(async (req, res, next) => {
  if (res.locals.user) {
    try {
      const Cart = require('./models/Cart');
      const cart = await Cart.findOne({ user: res.locals.user.userId });
      res.locals.cartCount = cart ? cart.items.length : 0;
    } catch (error) {
      console.error('Error fetching cart info:', error);
      res.locals.cartCount = 0;
    }
  } else {
    res.locals.cartCount = 0;
  }
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);

// Home page
app.get('/', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const featuredProducts = await Product.find({ featured: true }).limit(6);
    res.render('index', { featuredProducts }); 
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.render('index', { featuredProducts: [] });
  }
});

// 404 page
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});