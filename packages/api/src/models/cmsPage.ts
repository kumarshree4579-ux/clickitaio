import { Schema, model, Document } from 'mongoose';

export interface ICmsPage extends Document {
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
}

const CmsPageSchema = new Schema<ICmsPage>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  metaTitle: { type: String },
  metaDescription: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const CmsPage = model<ICmsPage>('CmsPage', CmsPageSchema);
