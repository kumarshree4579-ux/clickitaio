import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  user: Types.ObjectId;
  refreshToken: string;
  userAgent: string;
  ip: string;
  lastActive: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true, unique: true },
  userAgent: { type: String, default: 'Unknown Device' },
  ip: { type: String, default: 'Unknown IP' },
  lastActive: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Automatically delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model<ISession>('Session', SessionSchema);
