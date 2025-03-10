const Product = require('../models/Product');

const productController = {
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      res.render('products/index', { products });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).render('error', { message: 'Failed to fetch products' });
    }
  },
  
  getFeaturedProducts: async (req, res) => {
    try {
      const featuredProducts = await Product.find({ featured: true }).limit(6);
      res.render('products/featured', { products: featuredProducts });
    } catch (error) {
      console.error('Error fetching featured products:', error);
      res.status(500).render('error', { message: 'Failed to fetch featured products' });
    }
  },
  
  getProductsByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      
      // Validate that category is either t-shirt or sweater
      if (category !== 't-shirt' && category !== 'sweater') {
        return res.status(404).render('error', { message: 'Category not found' });
      }
      
      const products = await Product.find({ category });
      res.render('products/category', { 
        products, 
        category: category === 't-shirt' ? 'T-Shirts' : 'Sweaters'
      });
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).render('error', { message: 'Failed to fetch products' });
    }
  },
  
  getProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).render('error', { message: 'Product not found' });
      }
      
      res.render('products/details', { product });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).render('error', { message: 'Failed to fetch product details' });
    }
  },
  
  searchProducts: async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.redirect('/products');
      }
      
      const products = await Product.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { color: { $regex: query, $options: 'i' } },
          { size: { $regex: query, $options: 'i' } }
        ]
      });
      
      res.render('products/search', { products, searchQuery: query });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).render('error', { message: 'Failed to search products' });
    }
  },
  
  // Admin routes - keep these for managing the products
  createProduct: async (req, res) => {
    try {
      const { name, description, price, stock, image, category, size, color, featured } = req.body;
      
      const product = new Product({
        name,
        description,
        price,
        stock,
        image,
        category,
        size,
        color,
        featured: featured === 'on' ? true : false
      });
      
      await product.save();
      res.redirect('/products');
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).render('error', { message: 'Failed to create product' });
    }
  },
  
  updateProduct: async (req, res) => {
    try {
      const { name, description, price, stock, image, category, size, color, featured } = req.body;
      
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          name,
          description,
          price,
          stock,
          image,
          category,
          size,
          color,
          featured: featured === 'on' ? true : false
        },
        { new: true }
      );
      
      if (!updatedProduct) {
        return res.status(404).render('error', { message: 'Product not found' });
      }
      
      res.redirect(`/products/${updatedProduct._id}`);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).render('error', { message: 'Failed to update product' });
    }
  },
  
  deleteProduct: async (req, res) => {
    try {
      const deletedProduct = await Product.findByIdAndDelete(req.params.id);
      
      if (!deletedProduct) {
        return res.status(404).render('error', { message: 'Product not found' });
      }
      
      res.redirect('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).render('error', { message: 'Failed to delete product' });
    }
  }
};

module.exports = productController;