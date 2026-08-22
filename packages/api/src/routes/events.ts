import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { sse } from '../services/sse';

const router = Router();

// Endpoint for clients to connect to the SSE stream
router.get('/stream', requireAuth, (req: AuthedRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send an initial event to establish connection
  res.write(`data: ${JSON.stringify({ message: 'Connected' })}\n\n`);

  // Add client to the SSE service
  sse.addClient(req.user!.sub, req.user!.role, res);
});

// Admin-only route to broadcast a marketing message to all customers
router.post('/broadcast', requireAuth, requireRole('super_admin', 'order_manager'), (req: AuthedRequest, res: Response) => {
  const { title, message } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  sse.broadcastToAll('marketing', { title, message, at: new Date() });
  
  return res.json({ success: true, message: 'Broadcast sent to all connected clients.' });
});

export default router;
