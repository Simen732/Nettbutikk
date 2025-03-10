const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const wishlistController = {
  getWishlist: async (req, res) => {
    try {
      let wishlist = await Wishlist.findOne({ user: req.user.userId }).populate('items.product');
      
      if (!wishlist) {
        wishlist = { items: [] };
      }
      
      res.render('wishlist/index', { wishlist });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      res.status(500).render('error', { message: 'Failed to fetch wishlist' });
    }
  },
  
  addToWishlist: async (req, res) => {
    try {
      const { productId } = req.body;
      
      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Find or create wishlist
      let wishlist = await Wishlist.findOne({ user: req.user.userId });
      
      if (!wishlist) {
        wishlist = new Wishlist({
          user: req.user.userId,
          items: []
        });
      }
      
      // Check if product already exists in wishlist
      const existingItem = wishlist.items.find(item => 
        item.product.toString() === productId
      );
      
      if (existingItem) {
        // Product already in wishlist
        return res.redirect('/wishlist');
      } else {
        // Add new item
        wishlist.items.push({
          product: productId
        });
      }
      
      wishlist.updatedAt = Date.now();
      await wishlist.save();
      
      res.redirect('/wishlist');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      res.status(500).render('error', { message: 'Failed to add product to wishlist' });
    }
  },
  
  removeFromWishlist: async (req, res) => {
    try {
      const { itemId } = req.params;
      
      let wishlist = await Wishlist.findOne({ user: req.user.userId });
      
      if (!wishlist) {
        return res.status(404).json({ message: 'Wishlist not found' });
      }
      
      // Remove item
      wishlist.items = wishlist.items.filter(item => item._id.toString() !== itemId);
      
      wishlist.updatedAt = Date.now();
      await wishlist.save();
      
      res.redirect('/wishlist');
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      res.status(500).render('error', { message: 'Failed to remove item from wishlist' });
    }
  },
  
  clearWishlist: async (req, res) => {
    try {
      await Wishlist.findOneAndUpdate(
        { user: req.user.userId },
        { items: [], updatedAt: Date.now() }
      );
      
      res.redirect('/wishlist');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      res.status(500).render('error', { message: 'Failed to clear wishlist' });
    }
  }
};

module.exports = wishlistController;