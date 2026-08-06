import { Schema, model, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  hashedOtp: string;
  expiresAt: Date;
  used: boolean;
}

const OTPSchema = new Schema<IOTP>({
  email: { type: String, required: true, index: true },
  hashedOtp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete expired OTPs from MongoDB
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = model<IOTP>('Otp', OTPSchema);
