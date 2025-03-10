const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  image: {
    type: String,
    default: 'default.jpg'
  },
  category: {
    type: String,
    required: true,
    enum: ['t-shirt', 'sweater'] // Only allow these two categories
  },
//   size: {
//     type: String,
//     required: true,
//     enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
//   },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);