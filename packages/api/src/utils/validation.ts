import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ── Schemas ────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const OtpRequestSchema = z.object({
  email: z.string().email(),
});

export const OtpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const ProductSchema = z.object({
  name: z.string().min(2).max(200),
  sku: z.string().min(1).max(50),
  slug: z.string().min(2).max(200),
  mrp: z.number().positive(),
  sellingPrice: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  gst: z.number().min(0).max(100).default(0),
  weight: z.string().max(100).optional(),
  warranty: z.string().max(200).optional(),
  returnPolicy: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional(), public_id: z.string().optional() })).default([]),
});

export const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  parent: z.string().nullable().optional(),
  description: z.string().max(500).optional(),
  image: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const BrandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  logo: z.string().url().optional().or(z.literal('')),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const OrderSchema = z.object({
  items: z.array(z.object({
    _id: z.string(),
    qty: z.number().int().positive(),
  })).min(1),
  address: z.object({
    name: z.string().min(1),
    phone: z.string().min(10).max(15),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(4).max(10),
    country: z.string().default('India'),
  }),
  paymentMethod: z.enum(['razorpay', 'cod', 'wallet']),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const ReviewSchema = z.object({
  product: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(5).max(2000),
  orderId: z.string().optional(),
});

export const CouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(['flat', 'percentage', 'free_shipping']),
  value: z.number().min(0),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().default(1),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  description: z.string().max(200).optional(),
});

export const AddressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10).max(15),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(4).max(10),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});

// ── Middleware factory ─────────────────────────────────

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: (result as any).error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    req.body = result.data;
    next();
  };
}
