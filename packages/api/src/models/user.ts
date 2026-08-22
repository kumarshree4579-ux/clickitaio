import { Schema, model, Document } from 'mongoose';

export type UserRole = 'super_admin' | 'inventory_staff' | 'order_manager' | 'customer';

export interface IUser extends Document {
  name?: string;
  email: string;
  mobile?: string;
  passwordHash?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  mobile: { type: String },
  passwordHash: { type: String },
  role: { type: String, enum: ['super_admin', 'inventory_staff', 'order_manager', 'customer'], default: 'customer' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const User = model<IUser>('User', UserSchema);
