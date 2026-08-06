import { Schema, model, Document, Types } from 'mongoose';

export interface IProductVariant {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  image?: string;
  barcode?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  brand?: Types.ObjectId;
  category?: Types.ObjectId;
  description?: string;
  shortDescription?: string;
  mrp: number;
  sellingPrice: number;
  costPrice?: number;
  gst?: number;
  images: { url: string; public_id?: string; alt?: string }[];
  stock: number;
  minStock?: number;
  variants: IProductVariant[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  status: 'active' | 'inactive' | 'draft';
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  weight?: number;
  warranty?: string;
  returnPolicy?: string;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String },
  brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  description: { type: String },
  shortDescription: { type: String },
  mrp: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  costPrice: { type: Number },
  gst: { type: Number, default: 0 },
  images: [{ url: String, public_id: String, alt: String }],
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  variants: [{
    sku: String,
    attributes: { type: Map, of: String },
    price: Number,
    stock: Number,
    image: String,
    barcode: String,
  }],
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
  metaTitle: { type: String },
  metaDescription: { type: String },
  tags: [{ type: String }],
  weight: { type: Number },
  warranty: { type: String },
  returnPolicy: { type: String },
}, { timestamps: true });

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product = model<IProduct>('Product', ProductSchema);
