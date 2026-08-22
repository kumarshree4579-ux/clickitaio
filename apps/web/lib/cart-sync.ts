import API from './api';
import { apiFetch } from './apiFetch';

export async function syncCartToServer(cart: any[]) {
  try {
    // Generate a guestId if it doesn't exist
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('guestId', guestId);
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const items = cart.map(c => ({
      product: c._id,
      quantity: c.qty,
      price: c.price || c.sellingPrice || 0
    }));

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    apiFetch('/carts/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ guestId, items, totalAmount })
    }).catch(() => { /* ignore fetch errors silently in background */ });

  } catch (error) {
    // ignore
  }
}
