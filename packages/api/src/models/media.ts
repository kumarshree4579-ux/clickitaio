import { Schema, model, Document, Types } from 'mongoose';

export interface IMedia extends Document {
  originalName: string;
  url: string;
  public_id: string;
  uploadedBy: Types.ObjectId;
  batchId: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>({
  originalName: { type: String, required: true, index: true },
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  batchId: { type: String, required: true, index: true },
  size: { type: Number, default: 0 },
}, { timestamps: true });

// Text index for search by filename
MediaSchema.index({ originalName: 'text' });

export const Media = model<IMedia>('Media', MediaSchema);
