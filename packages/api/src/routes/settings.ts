import { Router, Request, Response } from 'express';
import { StoreSettings } from '../models/storeSettings';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Point-in-polygon using ray casting
function pointInPolygon(lat: number, lng: number, coords: [number, number][]): boolean {
  // coords are [lng, lat]
  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0], yi = coords[i][1]; // lng, lat
    const xj = coords[j][0], yj = coords[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function formatETA(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

async function getSettings() {
  let s = await StoreSettings.findOne();
  if (!s) s = await StoreSettings.create({});
  return s;
}

// Public: get public-facing settings (no secrets)
router.get('/public', async (_req: Request, res: Response) => {
  const s = await getSettings();
  return res.json({
    storeName: s.storeName,
    storeLocation: s.storeLocation,
    estimatedDeliveryMinutes: s.estimatedDeliveryMinutes,
    isDeliveryEnabled: s.isDeliveryEnabled,
    minOrderAmount: s.minOrderAmount,
    freeDeliveryAbove: s.freeDeliveryAbove,
    deliveryCharge: s.deliveryCharge,
    hasZones: s.deliveryZones.filter(z => z.isActive).length > 0,
    trustBadges: s.trustBadges,
    topbarTabs: s.topbarTabs,
    appTheme: s.appTheme,
  });
});

// Public: check if a lat/lng is serviceable
router.post('/check-delivery', async (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  if (lat == null || lng == null) return res.status(400).json({ error: 'lat and lng required' });

  const s = await getSettings();

  if (!s.isDeliveryEnabled) {
    return res.json({ serviceable: false, message: 'Delivery is currently unavailable.' });
  }

  const activeZones = s.deliveryZones.filter(z => z.isActive && z.coordinates.length >= 3);

  // If no zones defined — treat entire area as serviceable
  if (!activeZones.length) {
    const eta = formatETA(s.estimatedDeliveryMinutes);
    const message = s.deliveryMessage.replace('{time}', eta);
    return res.json({ serviceable: true, estimatedMinutes: s.estimatedDeliveryMinutes, eta, message });
  }

  const inZone = activeZones.some(z => pointInPolygon(Number(lat), Number(lng), z.coordinates));

  if (!inZone) {
    return res.json({ serviceable: false, message: s.unserviceableMessage });
  }

  const eta = formatETA(s.estimatedDeliveryMinutes);
  const message = s.deliveryMessage.replace('{time}', eta);
  return res.json({ serviceable: true, estimatedMinutes: s.estimatedDeliveryMinutes, eta, message });
});

// Admin: get full settings
router.get('/', requireAuth, requireRole('super_admin'), async (_req, res: Response) => {
  return res.json(await getSettings());
});

// Admin: update settings
router.put('/', requireAuth, requireRole('super_admin'), async (req: Request, res: Response) => {
  let s = await StoreSettings.findOne();
  if (!s) s = await StoreSettings.create(req.body);
  else s.set(req.body);
  await s.save();
  return res.json(s);
});

export default router;
