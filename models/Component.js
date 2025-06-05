const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: [
      'CPU', 'GPU', 'RAM', 'Cooler', 'Keyboard', 
      'Monitor', 'Mouse', 'Laptop', 'Motherboard', 
      'Storage', 'PcCase', 'PSU' // ✅ Added 'PSU'
    ]
  },
  brand: { 
    type: String, 
    trim: true, 
    default: 'Unknown' 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  image: {  
    type: String, 
    trim: true, 
    default: '' 
  },
  specs: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  stock: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('Component', componentSchema);
