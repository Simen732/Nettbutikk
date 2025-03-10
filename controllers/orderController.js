const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const orderController = {
  createOrder: async (req, res) => {
    try {
      const { firstName, lastName, address, city, postalCode, country, paymentMethod } = req.body;
      
      // Get user's cart
      const cart = await Cart.findOne({ user: req.user.userId }).populate('items.product');
      
      if (!cart || cart.items.length === 0) {
        return res.status(400).render('error', { message: 'Cart is empty' });
      }
      
      // Check stock availability
      for (let item of cart.items) {
        const product = await Product.findById(item.product);
        
        if (!product || product.stock < item.quantity) {
          return res.status(400).render('error', { 
            message: `Not enough stock available for ${product ? product.name : 'a product'}`
          });
        }
      }
      
      // Create order items
      const orderItems = cart.items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Create order
      const order = new Order({
        user: req.user.userId,
        items: orderItems,
        totalAmount: cart.totalAmount,
        shippingAddress: {
          address: `${firstName} ${lastName}, ${address}`,
          city,
          postalCode,
          country
        },
        paymentMethod,
        paidAt: Date.now() // Assuming immediate payment
      });
      
      await order.save();
      
      // Update product stock
      for (let item of cart.items) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { stock: -item.quantity } }
        );
      }
      
      // Clear cart - FIXED THIS LINE
      await Cart.findOneAndDelete({ _id: cart._id });
      // or alternatively:
      // await Cart.deleteOne({ _id: cart._id });
      
      res.render('orders/success', { order });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).render('error', { message: 'Failed to create order' });
    }
  },
  
  getMyOrders: async (req, res) => {
    try {
      const orders = await Order.find({ user: req.user.userId }).sort({ createdAt: -1 });
      res.render('orders/my-orders', { orders });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).render('error', { message: 'Failed to fetch your orders' });
    }
  },
  
  getOrderById: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).render('error', { message: 'Order not found' });
      }
      
      // Check if the order belongs to the user or the user is an admin
      if (order.user.toString() !== req.user.userId && !req.user.isAdmin) {
        return res.status(403).render('error', { message: 'Not authorized' });
      }
      
      res.render('orders/details', { order });
    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).render('error', { message: 'Failed to fetch order details' });
    }
  },
  
  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'username email');
      res.render('admin/orders', { orders });
    } catch (error) {
      console.error('Error fetching all orders:', error);
      res.status(500).render('error', { message: 'Failed to fetch orders' });
    }
  },
  
  updateOrderStatus: async (req, res) => {
    try {
      const { status } = req.body;
      
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      
      if (!order) {
        return res.status(404).render('error', { message: 'Order not found' });
      }
      
      res.redirect(`/orders/${order._id}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).render('error', { message: 'Failed to update order status' });
    }
  }
};

module.exports = orderController;