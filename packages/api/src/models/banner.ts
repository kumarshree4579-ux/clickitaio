import { Schema, model, Document } from 'mongoose';

export type BannerType = 'slider' | 'offer' | 'category' | 'popup' | 'mobile';

export interface IBanner extends Document {
  title: string;
  image: string;
  link?: string;
  type: BannerType;
  sortOrder: number;
  isActive: boolean;
}

const BannerSchema = new Schema<IBanner>({
  title: { type: String, required: true },
  image: { type: String, required: true },
  link: { type: String },
  type: { type: String, enum: ['slider', 'offer', 'category', 'popup', 'mobile'], default: 'slider' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Banner = model<IBanner>('Banner', BannerSchema);
