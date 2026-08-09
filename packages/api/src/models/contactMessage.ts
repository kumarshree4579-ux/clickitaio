import { Schema, model, Document } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
}

const ContactMessageSchema = new Schema<IContactMessage>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export const ContactMessage = model<IContactMessage>('ContactMessage', ContactMessageSchema);
