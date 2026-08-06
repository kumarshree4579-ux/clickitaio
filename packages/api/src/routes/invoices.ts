import { Router, Request, Response } from 'express';
import { Order } from '../models/order';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/user';
import { escapeHtml } from '../utils/sanitize';

const router = Router();

// GET /invoices/:orderId — token via Authorization header or ?token= query
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const tokenStr = (req.headers.authorization?.slice(7)) || (req.query.token as string);
    if (!tokenStr) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyAccessToken(tokenStr) as any;
    const user = await User.findById(payload.sub).select('role');
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const order = await Order.findById(req.params.orderId).populate('customer', 'name email');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const customer = order.customer as any;
    if (!['super_admin', 'order_manager'].includes(user.role) && customer._id.toString() !== payload.sub) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const date = new Date((order as any).createdAt as Date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const itemRows = order.items.map(item => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.name)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${escapeHtml(item.sku)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${escapeHtml(item.qty)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">&#8377;${escapeHtml(item.price)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">&#8377;${escapeHtml(item.price * item.qty)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice - ${order.orderNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .meta-box { background: #f9fafb; padding: 16px; border-radius: 8px; }
    .meta-box h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    .meta-box p { margin: 2px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead { background: #f3f4f6; }
    th { padding: 10px 8px; text-align: left; font-size: 13px; color: #6b7280; }
    .totals { margin-left: auto; width: 280px; }
    .totals tr td { padding: 6px 8px; font-size: 14px; }
    .totals tr:last-child td { font-weight: bold; font-size: 16px; border-top: 2px solid #111; padding-top: 10px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; background: #dcfce7; color: #166534; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Ecom Store</div>
      <p style="color:#6b7280;font-size:13px;margin-top:4px">support@ecom.store</p>
    </div>
    <div style="text-align:right">
      <div style="font-size:28px;font-weight:bold;color:#111">INVOICE</div>
      <p style="color:#6b7280;font-size:13px">#${escapeHtml(order.orderNumber)}</p>
      <p style="color:#6b7280;font-size:13px">${escapeHtml(date)}</p>
      <span class="badge">${escapeHtml(order.paymentStatus)}</span>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <h3>Bill To</h3>
      <p><strong>${escapeHtml(customer.name || customer.email)}</strong></p>
      <p>${escapeHtml(customer.email)}</p>
    </div>
    <div class="meta-box">
      <h3>Ship To</h3>
      <p><strong>${escapeHtml(order.address.name)}</strong></p>
      <p>${escapeHtml(order.address.line1)}${order.address.line2 ? ', ' + escapeHtml(order.address.line2) : ''}</p>
      <p>${escapeHtml(order.address.city)}, ${escapeHtml(order.address.state)} - ${escapeHtml(order.address.pincode)}</p>
      <p>&#128222; ${escapeHtml(order.address.phone)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th><th style="text-align:center">SKU</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td style="text-align:right">₹${order.subtotal}</td></tr>
    <tr><td>Shipping</td><td style="text-align:right">${order.shippingCharge === 0 ? 'Free' : '₹' + order.shippingCharge}</td></tr>
    ${order.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right;color:#16a34a">-₹${order.discount}</td></tr>` : ''}
    <tr><td>Total</td><td style="text-align:right">₹${order.total}</td></tr>
  </table>

  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#9ca3af;text-align:center">
    Payment: ${order.paymentMethod.toUpperCase()} · Thank you for shopping with us!
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
