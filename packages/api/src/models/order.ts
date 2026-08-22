import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'received' | 'confirmed' | 'accepted' | 'processing' | 'packing' | 'packed' | 'assigned_delivery' | 'shipped' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled' | 'returned' | 'refunded' | 'abandoned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'razorpay' | 'cod' | 'wallet';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  sku: string;
  image?: string;
  price: number;
  mrp: number;
  qty: number;
}

export interface IAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: Types.ObjectId;
  items: IOrderItem[];
  address: IAddress;
  deliveryLocation?: { lat: number; lng: number };
  estimatedDeliveryMinutes?: number;
  estimatedDeliveryAt?: Date;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  couponCode?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  notes?: string;
  statusHistory: { status: OrderStatus; at: Date; note?: string }[];
}

const AddressSchema = new Schema<IAddress>({
  name: String, phone: String, line1: String, line2: String,
  city: String, state: String, pincode: String, country: { type: String, default: 'India' },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: String, sku: String, image: String,
    price: Number, mrp: Number, qty: Number,
  }],
  address: { type: AddressSchema, required: true },
  deliveryLocation: { lat: Number, lng: Number },
  estimatedDeliveryMinutes: { type: Number },
  estimatedDeliveryAt: { type: Date },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  total: { type: Number, required: true },
  couponCode: { type: String },
  status: { type: String, enum: ['pending','received','confirmed','accepted','processing','packing','packed','assigned_delivery','shipped','out_for_delivery','delivered','completed','cancelled','returned','refunded','abandoned'], default: 'pending' },
  paymentMethod: { type: String, enum: ['razorpay','cod','wallet'], required: true },
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  notes: { type: String },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now }, note: String }],
}, { timestamps: true });

export const Order = model<IOrder>('Order', OrderSchema);
