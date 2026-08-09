'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Header from '../../../components/Header';
import Link from 'next/link';

import API from '../../../lib/api';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
  refunded: 'bg-gray-100 text-gray-700',
};

const STEPS = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const fmt = (n: number) => n.toLocaleString('en-IN');

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<><Header /><div className="flex items-center justify-center h-64 text-gray-400">Loading...</div></>}>
      <OrderDetail />
    </Suspense>
  );
}

function OrderDetail() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === '1';
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setOrder({ error: 'Please sign in to view your order.' });
      return;
    }

    fetch(`${API}/orders/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setOrder({ error: data.error || 'Unable to load order.' });
        } else {
          setOrder(data);
        }
      })
      .catch(() => setOrder({ error: 'Unable to load order.' }))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function cancelOrder() {
    if (!confirm('Cancel this order?')) return;
    setCancelling(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/orders/${order._id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
    }
    setCancelling(false);
  }

  if (loading) return <><Header /><div className="flex items-center justify-center h-64 text-gray-400">Loading...</div></>;
  if (!order || order.error) return <><Header /><div className="text-center py-20 text-gray-400">
    <p className="mb-2">{order?.error || 'Order not found.'}</p>
    <Link href="/orders" className="text-indigo-600 underline">Back to orders</Link>
  </div></>;

  const stepIdx = STEPS.indexOf(order.status);
  const isCancelled = ['cancelled', 'returned', 'refunded'].includes(order.status);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {isSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl shrink-0">✅</div>
            <div>
              <p className="font-bold text-emerald-800">Order placed successfully!</p>
              <p className="text-sm text-emerald-600 mt-0.5">We'll send you updates via email.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/orders" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mb-1">
              ← My Orders
            </Link>
            <h1 className="text-xl font-bold text-gray-900">#{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Progress bar */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-100 z-0" />
              <div className="absolute left-0 top-4 h-0.5 bg-indigo-500 z-0 transition-all"
                style={{ width: stepIdx >= 0 ? `${(stepIdx / (STEPS.length - 1)) * 100}%` : '0%' }} />
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${i <= stepIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] text-gray-500 text-center capitalize hidden sm:block">{s.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Timeline */}
        {order.statusHistory?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Order Timeline</h2>
            <div className="space-y-0">
              {[...order.statusHistory].reverse().map((h: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${i === 0 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                    {i < order.statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-semibold capitalize ${i === 0 ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {h.status.replace(/_/g, ' ')}
                    </p>
                    {h.note && <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ETA */}
        {order.estimatedDeliveryAt && !['delivered','cancelled','returned','refunded'].includes(order.status) && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <p className="text-sm font-semibold text-indigo-800">Estimated Delivery</p>
              <p className="text-xs text-indigo-600 mt-0.5">
                {new Date(order.estimatedDeliveryAt).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Items ({order.items.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku} · Qty: {item.qty}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">₹{fmt(item.price * item.qty)}</p>
                  <p className="text-xs text-gray-400">₹{fmt(item.price)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Delivery address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Delivery Address</h2>
            <p className="text-sm font-medium text-gray-800">{order.address?.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{order.address?.phone}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ''}<br />
              {order.address?.city}, {order.address?.state} - {order.address?.pincode}
            </p>
          </div>

          {/* Price summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Price Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{fmt(order.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={order.shippingCharge === 0 ? 'text-green-600' : ''}>{order.shippingCharge === 0 ? 'Free' : `₹${order.shippingCharge}`}</span>
              </div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{fmt(order.discount)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                <span>Total</span><span>₹{fmt(order.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 pt-1">
                <span>Payment</span>
                <span className="capitalize">{order.paymentMethod} · <span className={order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>{order.paymentStatus}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel button */}
        {['pending', 'confirmed'].includes(order.status) && (
          <button onClick={cancelOrder} disabled={cancelling}
            className="w-full border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-2xl text-sm font-medium transition-colors disabled:opacity-50">
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </main>
    </>
  );
}
