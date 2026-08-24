import { Schema, model, Document } from 'mongoose';

export interface IDeliveryZone {
  name: string;
  coordinates: [number, number][]; // [lng, lat] pairs forming a polygon
  isActive: boolean;
}

export interface ITrustBadge {
  icon: string;
  title: string;
  subtitle: string;
  isActive: boolean;
}

export interface IStoreSettings extends Document {
  storeName: string;
  storeLocation: { lat: number; lng: number };
  deliveryZones: IDeliveryZone[];
  estimatedDeliveryMinutes: number;
  deliveryMessage: string;
  unserviceableMessage: string;
  isDeliveryEnabled: boolean;
  minOrderAmount: number;
  freeDeliveryAbove: number;
  deliveryCharge: number;
  trustBadges: ITrustBadge[];
  topbarTabs?: { label: string; categorySlug: string; isActive: boolean }[];
  appTheme?: { primaryColor: string; secondaryColor: string; activeThemeName: string };
  orderAlertSound?: 'beep' | 'chime' | 'bell' | 'urgent' | 'none';
  orderAlertDuration?: number; // seconds
}

const StoreSettingsSchema = new Schema<IStoreSettings>({
  storeName: { type: String, default: 'Ecom Store' },
  storeLocation: {
    lat: { type: Number, default: 20.5937 },
    lng: { type: Number, default: 78.9629 },
  },
  deliveryZones: [{
    name: { type: String, required: true },
    coordinates: { type: Array, default: [] }, // array of [lng, lat]
    isActive: { type: Boolean, default: true },
  }],
  estimatedDeliveryMinutes: { type: Number, default: 45 },
  deliveryMessage: { type: String, default: 'Delivery in {time}' },
  unserviceableMessage: { type: String, default: 'Sorry, we do not deliver to your area yet.' },
  isDeliveryEnabled: { type: Boolean, default: true },
  minOrderAmount: { type: Number, default: 0 },
  freeDeliveryAbove: { type: Number, default: 500 },
  deliveryCharge: { type: Number, default: 49 },
  trustBadges: [{
    icon: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  }],
  topbarTabs: [{
    label: String,
    categorySlug: String,
    isActive: { type: Boolean, default: true },
  }],
  appTheme: {
    primaryColor: { type: String, default: '#4f46e5' },
    secondaryColor: { type: String, default: '#7c3aed' },
    activeThemeName: { type: String, default: 'default' },
  },
  orderAlertSound: { type: String, enum: ['beep', 'chime', 'bell', 'urgent', 'none'], default: 'beep' },
  orderAlertDuration: { type: Number, default: 10 },
}, { timestamps: true });

export const StoreSettings = model<IStoreSettings>('StoreSettings', StoreSettingsSchema);
