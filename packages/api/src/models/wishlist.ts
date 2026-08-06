import { Schema, model, Document, Types } from 'mongoose';

export interface IWishlist extends Document {
  customer: Types.ObjectId;
  product: Types.ObjectId;
}

const WishlistSchema = new Schema<IWishlist>({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: true });

WishlistSchema.index({ customer: 1, product: 1 }, { unique: true });

export const Wishlist = model<IWishlist>('Wishlist', WishlistSchema);
