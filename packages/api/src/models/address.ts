import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomerAddress extends Document {
  customer: Types.ObjectId;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const CustomerAddressSchema = new Schema<ICustomerAddress>({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

export const CustomerAddress = model<ICustomerAddress>('CustomerAddress', CustomerAddressSchema);
