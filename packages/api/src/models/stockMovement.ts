import { Schema, model, Document, Types } from 'mongoose';

export type MovementType = 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer';

export interface IStockMovement extends Document {
  product: Types.ObjectId;
  type: MovementType;
  qty: number; // positive = in, negative = out
  before: number;
  after: number;
  reference?: string; // order number, PO number etc
  note?: string;
  createdBy?: Types.ObjectId;
}

const StockMovementSchema = new Schema<IStockMovement>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['purchase', 'sale', 'adjustment', 'return', 'transfer'], required: true },
  qty: { type: Number, required: true },
  before: { type: Number, required: true },
  after: { type: Number, required: true },
  reference: { type: String },
  note: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

StockMovementSchema.index({ product: 1, createdAt: -1 });

export const StockMovement = model<IStockMovement>('StockMovement', StockMovementSchema);
