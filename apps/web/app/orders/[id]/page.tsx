'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '../../../components/Header';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_STEPS = ['pending','confirmed','packed','shipped','out_for_delivery','delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed', confirmed: 'Confirmed', packed: 'Packed',
  shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
  cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === '1';
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  async function cancelOrder() {
    if (!confirm('Cancel this order?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/orders/${id}/cancel`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setOrder(await res.json());
  }

  if (loading) return <><Header /><div className="flex items-center justify-center h-64 text-gray-400">Loading...</div></>;
  if (!order) return <><Header /><div className="text-center py-20 text-gray-400">Order not found</div></>;

  const stepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = ['cancelled','returned','refunded'].includes(order.status);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-bold text-green-700 text-lg">Order Placed Successfully!</p>
            <p className="text-green-600 text-sm">Order #{order.orderNumber}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Order #{order.orderNumber}</h1>
              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${isCancelled ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <p className="text-sm text-gray-500 mt-1">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'} · {order.paymentStatus}</p>
            </div>
          </div>

          {/* Timeline */}
          {!isCancelled && (
            <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-2">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i <= stepIdx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {i < stepIdx ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs mt-1 text-center whitespace-nowrap ${i <= stepIdx ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                      {STATUS_LABELS[step]}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 ${i < stepIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          <div className="space-y-3 mb-4">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">SKU: {item.sku} · Qty: {item.qty}</p>
                </div>
                <p className="font-medium text-gray-800">₹{item.price * item.qty}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-3 space-y-1 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{order.shippingCharge === 0 ? 'Free' : `₹${order.shippingCharge}`}</span></div>
            <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t"><span>Total</span><span>₹{order.total}</span></div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-2">Delivery Address</h2>
          <p className="text-sm text-gray-700">{order.address.name} · {order.address.phone}</p>
          <p className="text-sm text-gray-500">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/orders" className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">← My Orders</Link>
          {['pending','confirmed'].includes(order.status) && (
            <button onClick={cancelOrder} className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50">Cancel Order</button>
          )}
          <a href="#" onClick={e => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.text()).then(html => {
                const w = window.open('', '_blank');
                w?.document.write(html);
                w?.document.close();
              });
          }} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">🧾 Invoice</a>
          <Link href="/products" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Continue Shopping</Link>
        </div>
      </main>
    </>
  );
}
