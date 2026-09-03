import { Router, Request, Response } from 'express';
import { DeviceToken } from '../models/deviceToken';
import { requireAuth, requireRole, optionalAuth, AuthedRequest } from '../middleware/auth';
import { sse } from '../services/sse';
import { Expo } from 'expo-server-sdk';

const router = Router();
const expo = new Expo();

// Register a new device push token
router.post('/push-token', optionalAuth, async (req: AuthedRequest, res: Response) => {
  const { token, platform } = req.body;
  if (!token || !platform) {
    return res.status(400).json({ error: 'Token and platform are required' });
  }

  try {
    const userId = req.user?.sub;
    
    // Check if token exists
    let device = await DeviceToken.findOne({ token });
    if (device) {
      if (userId && String(device.userId) !== String(userId)) {
        device.userId = userId as any;
        await device.save();
      }
    } else {
      await DeviceToken.create({ token, platform, userId: userId || null });
    }
    
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Broadcast native push notification to all devices
router.post('/broadcast', requireAuth, requireRole('super_admin', 'order_manager'), async (req: AuthedRequest, res: Response) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  try {
    // 1. Broadcast via SSE (for active web visitors)
    sse.broadcastToAll('marketing', { title, message, at: new Date() });

    // 2. Broadcast via Expo Push API (for APK installations)
    const devices = await DeviceToken.find();
    const messages = [];

    for (const device of devices) {
      if (!Expo.isExpoPushToken(device.token)) {
        console.error(`Push token ${device.token} is not a valid Expo push token`);
        continue;
      }
      messages.push({
        to: device.token,
        sound: 'default' as 'default',
        title,
        body: message,
        data: { url: '/' },
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending push chunk', error);
      }
    }

    return res.json({ success: true, message: `Broadcast sent via SSE and ${messages.length} Expo push notifications.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

