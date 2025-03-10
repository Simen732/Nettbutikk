const Cart = require('../models/Cart');
const Product = require('../models/Product');

const cartController = {
  getCart: async (req, res) => {
    try {
      let cart = await Cart.findOne({ user: req.user.userId }).populate('items.product');
      
      if (!cart) {
        cart = { items: [], totalAmount: 0 };
      }
      
      res.render('cart/index', { cart });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).render('error', { message: 'Failed to fetch cart' });
    }
  },
  
  getCheckout: async (req, res) => {
    try {
      let cart = await Cart.findOne({ user: req.user.userId }).populate('items.product');
      
      if (!cart || cart.items.length === 0) {
        return res.redirect('/cart');
      }
      
      res.render('cart/checkout', { cart });
    } catch (error) {
      console.error('Error loading checkout page:', error);
      res.status(500).render('error', { message: 'Failed to load checkout page' });
    }
  },
  
  addToCart: async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      
      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Check if stock is available
      if (product.stock < quantity) {
        return res.status(400).json({ message: 'Not enough stock available' });
      }
      
      // Find or create cart
      let cart = await Cart.findOne({ user: req.user.userId });
      
      if (!cart) {
        cart = new Cart({
          user: req.user.userId,
          items: [],
          totalAmount: 0
        });
      }
      
      // Check if product already exists in cart
      const existingItemIndex = cart.items.findIndex(item => 
        item.product.toString() === productId
      );
      
      if (existingItemIndex > -1) {
        // Update quantity of existing item
        cart.items[existingItemIndex].quantity += Number(quantity);
      } else {
        // Add new item
        cart.items.push({
          product: productId,
          quantity: Number(quantity),
          price: product.price
        });
      }
      
      // Calculate total amount
      cart.totalAmount = cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );
      
      cart.updatedAt = Date.now();
      await cart.save();
      
      res.redirect('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).render('error', { message: 'Failed to add product to cart' });
    }
  },
  
  updateCartItem: async (req, res) => {
    try {
      const { quantity } = req.body;
      const { itemId } = req.params;
      
      let cart = await Cart.findOne({ user: req.user.userId });
      
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
      
      const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
      
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
      
      // Check stock
      const product = await Product.findById(cart.items[itemIndex].product);
      if (product.stock < quantity) {
        return res.status(400).json({ message: 'Not enough stock available' });
      }
      
      // Update quantity
      cart.items[itemIndex].quantity = Number(quantity);
      
      // Recalculate total
      cart.totalAmount = cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );
      
      cart.updatedAt = Date.now();
      await cart.save();
      
      res.redirect('/cart');
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).render('error', { message: 'Failed to update cart item' });
    }
  },
  
  removeFromCart: async (req, res) => {
    try {
      const { itemId } = req.params;
      
      let cart = await Cart.findOne({ user: req.user.userId });
      
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
      
      // Remove item
      cart.items = cart.items.filter(item => item._id.toString() !== itemId);
      
      // Recalculate total
      cart.totalAmount = cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );
      
      cart.updatedAt = Date.now();
      await cart.save();
      
      res.redirect('/cart');
    } catch (error) {
      console.error('Error removing item from cart:', error);
      res.status(500).render('error', { message: 'Failed to remove item from cart' });
    }
  },
  
  clearCart: async (req, res) => {
    try {
      await Cart.findOneAndUpdate(
        { user: req.user.userId },
        { items: [], totalAmount: 0, updatedAt: Date.now() }
      );
      
      res.redirect('/cart');
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).render('error', { message: 'Failed to clear cart' });
    }
  }
};

module.exports = cartController;