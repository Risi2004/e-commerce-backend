import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['pc_build', 'single_product'], required: true },
  products: [
    {
      productId: { type: String },
      name: { type: String },
      price: { type: Number },
      quantity: { type: Number },
      category: { type: String },
      imageUrl: { type: String },
      brand: { type: String },
      specs: { type: mongoose.Schema.Types.Mixed },
    }
  ],
  totalAmount: { type: Number, required: true },
  address: { type: String, default: "N/A" },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Order', orderSchema);
