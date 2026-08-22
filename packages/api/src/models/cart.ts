import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestId: { type: String }, // For unauthenticated users
  items: [CartItemSchema],
  totalAmount: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure a cart belongs to either a user or a guest, and index them
CartSchema.index({ user: 1 });
CartSchema.index({ guestId: 1 });
CartSchema.index({ lastActive: -1 });

export const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
