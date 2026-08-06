import sgMail from '@sendgrid/mail';

const FROM = process.env.FROM_EMAIL || 'no-reply@ecom.local';
const STORE_NAME = 'Ecom Store';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function send(to: string, subject: string, html: string) {
  if (process.env.SENDGRID_API_KEY) {
    try {
      await sgMail.send({ to, from: FROM, subject, html } as any);
    } catch (err) {
      console.error('SendGrid error', err);
    }
  } else {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
  }
}

export async function sendOtpEmail(email: string, otp: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[DEV OTP] ${email}: ${otp}`);
    return;
  }
  await send(email, `Your ${STORE_NAME} verification code`, `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#2563eb">${STORE_NAME}</h2>
      <p>Your verification code is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111;margin:24px 0">${otp}</div>
      <p style="color:#6b7280;font-size:13px">Expires in 10 minutes. Do not share this code.</p>
    </div>`);
}

export async function sendOrderConfirmationEmail(email: string, order: any) {
  const itemRows = order.items.map((i: any) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${i.qty}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">₹${i.price * i.qty}</td></tr>`
  ).join('');

  await send(email, `Order Confirmed - #${order.orderNumber}`, `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px">
      <h2 style="color:#2563eb">${STORE_NAME}</h2>
      <h3>🎉 Your order has been placed!</h3>
      <p>Order Number: <strong>#${order.orderNumber}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="text-align:right;font-size:16px"><strong>Total: ₹${order.total}</strong></div>
      <p style="color:#6b7280;font-size:13px;margin-top:24px">Payment: ${order.paymentMethod.toUpperCase()} · ${order.paymentStatus}</p>
      <p style="color:#6b7280;font-size:13px">Delivering to: ${order.address.line1}, ${order.address.city} - ${order.address.pincode}</p>
    </div>`);
}

export async function sendOrderStatusEmail(email: string, orderNumber: string, status: string) {
  const statusMessages: Record<string, string> = {
    confirmed: '✅ Your order has been confirmed and is being prepared.',
    packed: '📦 Your order has been packed and is ready for pickup.',
    shipped: '🚚 Your order is on its way!',
    out_for_delivery: '🛵 Your order is out for delivery today!',
    delivered: '🎉 Your order has been delivered. Enjoy!',
    cancelled: '❌ Your order has been cancelled.',
    refunded: '💰 Your refund has been processed.',
  };

  const message = statusMessages[status] || `Your order status has been updated to: ${status}`;

  await send(email, `Order #${orderNumber} — ${status.replace(/_/g, ' ')}`, `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#2563eb">${STORE_NAME}</h2>
      <h3>Order Update</h3>
      <p>Order: <strong>#${orderNumber}</strong></p>
      <p style="font-size:16px">${message}</p>
      <p style="color:#6b7280;font-size:13px;margin-top:24px">Thank you for shopping with ${STORE_NAME}!</p>
    </div>`);
}
