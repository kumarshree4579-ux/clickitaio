import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  parent?: Types.ObjectId;
  description?: string;
  image?: string;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  description: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Category = model<ICategory>('Category', CategorySchema);
