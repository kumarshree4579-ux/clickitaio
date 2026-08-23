'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Header from '../../../components/Header';
import Link from 'next/link';

import { apiFetch } from '../../../lib/apiFetch';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
  refunded: 'bg-gray-100 text-gray-700',
};

const STEPS = ['pending', 'received', 'confirmed', 'accepted', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const fmt = (n: number) => n.toLocaleString('en-IN');

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<><div className="flex items-center justify-center h-[70vh] text-gray-400 font-medium">Loading details...</div></>}>
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
  const [showConfetti, setShowConfetti] = useState(isSuccess);

  useEffect(() => {
    if (showConfetti) {
      const t = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showConfetti]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setOrder({ error: 'Please sign in to view your order.' });
      return;
    }

    function fetchOrder() {
      apiFetch(`/orders/${params.id}`)
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) {
            setOrder((prev: any) => prev || { error: data.error || 'Unable to load order.' });
          } else {
            setOrder(data);
          }
        })
        .catch(() => setOrder((prev: any) => prev || { error: 'Unable to load order.' }))
        .finally(() => setLoading(false));
    }

    fetchOrder();
    // Live tracking polling
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [params.id]);

  async function cancelOrder() {
    if (!confirm('Cancel this order?')) return;
    setCancelling(true);
    const res = await apiFetch(`/orders/${order._id}/cancel`, {
      method: 'PUT'
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
    }
    setCancelling(false);
  }

  if (loading) return <><div className="flex items-center justify-center h-[70vh] text-gray-400 font-medium">Loading tracking details...</div></>;
  if (!order || order.error) return (
    <>
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-3 text-center px-4">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4">🔍</div>
        <p className="text-gray-500 font-medium mb-6">{order?.error || 'Order not found.'}</p>
        <Link href="/orders" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors">Back to orders</Link>
      </div>
    </>
  );

  const stepIdx = STEPS.indexOf(order.status);
  const isCancelled = ['cancelled', 'returned', 'refunded'].includes(order.status);

  return (
    <>
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8 pb-20 sm:pb-8 space-y-4 sm:space-y-6">

        {/* Confetti / Success Hero */}
        {showConfetti && (
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center text-white shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-3 sm:mb-4 border border-white/30 shadow-inner">
              ✨
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1.5 sm:mb-2 tracking-tight">Order Confirmed!</h1>
            <p className="text-emerald-50 font-medium max-w-md mx-auto text-sm sm:text-base">Your order is being prepared. We'll keep you updated every step of the way.</p>
          </div>
        )}

        {/* Header (Back button + Status) */}
        {!showConfetti && (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <Link href="/orders" className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 mb-1">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                My Orders
              </Link>
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">Order #{order.orderNumber}</h1>
              <p className="text-[10px] sm:text-xs font-medium text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-right flex flex-col items-end shrink-0">
              <span className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-emerald-600 text-[9px] sm:text-[10px] font-bold">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                </span>
                LIVE
              </div>
            </div>
          </div>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
            <div className="text-2xl sm:text-3xl">❌</div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-red-900 tracking-tight">Order Cancelled</h2>
              <p className="text-red-700/90 mt-1 font-medium text-xs sm:text-sm">
                {order.statusHistory?.slice().reverse().find((h: any) => h.status === 'cancelled')?.note || 'This order was cancelled and will not be delivered.'}
              </p>
            </div>
          </div>
        )}

        {/* Live Progress Bar */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Track Order
            </h2>


            {/* Current Status Note */}
            {order.statusHistory?.length > 0 && (
              <div className="mt-8 bg-indigo-50/50 rounded-2xl p-4 flex gap-3 items-start border border-indigo-100/50">
                <div className="text-xl">🔔</div>
                <div>
                  <p className="text-sm font-bold text-indigo-900 capitalize">{order.statusHistory[order.statusHistory.length - 1].status.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-indigo-700/80 mt-0.5 font-medium">
                    {order.statusHistory[order.statusHistory.length - 1].note || 'Your order status has been updated.'}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-400 mt-1.5 uppercase tracking-wider">
                    {new Date(order.statusHistory[order.statusHistory.length - 1].at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ETA Highlight */}
        {order.estimatedDeliveryAt && !['delivered', 'cancelled', 'returned', 'refunded'].includes(order.status) && (
          <div className="bg-indigo-600 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-center justify-between shadow-md shadow-indigo-600/20">
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm font-medium">Estimated Delivery</p>
              <p className="text-lg sm:text-xl font-black mt-0.5">
                {new Date(order.estimatedDeliveryAt).toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl">
              ⏱️
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Items */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">Order Items</h2>
            </div>
            <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border border-gray-200/50">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg sm:text-xl">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-xs sm:text-sm leading-tight truncate">{item.name}</p>
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded-md">Qty: {item.qty}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-900 text-sm sm:text-base">₹{fmt(item.price * item.qty)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Delivery address */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Delivery Address
              </h2>
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100">
                <p className="text-sm font-bold text-gray-900">{order.address?.name}</p>
                <p className="text-xs text-gray-500 mt-1 mb-1.5 sm:mb-2 font-medium">{order.address?.phone}</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ''}<br />
                  {order.address?.city}, {order.address?.state} - <span className="font-bold text-gray-800">{order.address?.pincode}</span>
                </p>
              </div>
            </div>

            {/* Price summary */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Bill Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600 font-medium"><span>Item Total</span><span className="text-gray-900">₹{fmt(order.subtotal)}</span></div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Delivery Fee</span>
                  <span className={order.shippingCharge === 0 ? 'text-emerald-600 font-bold' : 'text-gray-900'}>{order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}</span>
                </div>
                {order.discount > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Coupon Discount</span><span>-₹{fmt(order.discount)}</span></div>}
                <div className="flex justify-between font-black text-gray-900 border-t border-gray-100 pt-3 mt-1 text-lg">
                  <span>Grand Total</span><span>₹{fmt(order.total)}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 mt-3 flex justify-between items-center border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{order.paymentMethod === 'cod' ? '💵' : '💳'}</span>
                    <div>
                      <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</span>
                      <span className="block text-sm font-semibold capitalize text-gray-900">{order.paymentMethod}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel button */}
        {['pending', 'confirmed'].includes(order.status) && (
          <div className="pt-4">
            <button onClick={cancelOrder} disabled={cancelling}
              className="w-full border-2 border-red-100 text-red-500 hover:bg-red-50 py-4 rounded-2xl text-sm font-bold transition-colors disabled:opacity-50">
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
