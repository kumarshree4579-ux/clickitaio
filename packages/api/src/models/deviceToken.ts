import { Schema, model, Document } from 'mongoose';

export interface IDeviceToken extends Document {
  token: string;
  platform: 'web' | 'apk';
  userId?: Schema.Types.ObjectId;
}

const DeviceTokenSchema = new Schema<IDeviceToken>({
  token: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['web', 'apk'], required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const DeviceToken = model<IDeviceToken>('DeviceToken', DeviceTokenSchema);
