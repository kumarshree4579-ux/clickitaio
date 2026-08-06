import { Schema, model, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  isActive: boolean;
}

const BrandSchema = new Schema<IBrand>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  logo: { type: String },
  description: { type: String },
  website: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Brand = model<IBrand>('Brand', BrandSchema);
