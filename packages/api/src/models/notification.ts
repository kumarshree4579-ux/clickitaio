import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  linkText?: string;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  link: { type: String },
  linkText: { type: String },
  isActive: { type: Boolean, default: true },
  startsAt: { type: Date },
  endsAt: { type: Date },
}, { timestamps: true });

export const Notification = model<INotification>('Notification', NotificationSchema);
