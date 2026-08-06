import { Schema, model, Document } from 'mongoose';

export type CouponType = 'flat' | 'percentage' | 'free_shipping';

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perCustomerLimit: number;
  expiresAt?: Date;
  isActive: boolean;
  description?: string;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['flat', 'percentage', 'free_shipping'], required: true },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
  perCustomerLimit: { type: Number, default: 1 },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  description: { type: String },
}, { timestamps: true });

export const Coupon = model<ICoupon>('Coupon', CouponSchema);
