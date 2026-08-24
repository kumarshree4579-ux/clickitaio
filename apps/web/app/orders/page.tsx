'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/apiFetch';
import { motion } from 'framer-motion';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  packed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  out_for_delivery: 'bg-orange-100 text-orange-700 border-orange-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  returned: 'bg-gray-100 text-gray-700 border-gray-200',
  refunded: 'bg-gray-100 text-gray-700 border-gray-200',
};

const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  confirmed: '👍',
  packed: '📦',
  shipped: '🚚',
  out_for_delivery: '🛵',
  delivered: '✅',
  cancelled: '❌',
  returned: '🔄',
  refunded: '💸',
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    apiFetch('/orders')
      .then(r => r.json()).then(d => setOrders(d.items || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-12">

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 h-14 px-4 sm:px-6 flex items-center gap-6 shadow-sm">

        {/* <div className="sticky top-0 z-40 bg-indigo-600 text-white px-4 sm:px-6 py-4 flex items-center gap-3 shadow-sm"> */}
        <h1 className="text-[18px] font-bold tracking-tight">My Orders</h1>
        {!loading && orders.length > 0 && (
          <span className="text-indigo-200 text-[14px] font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse flex flex-col gap-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              🛍️
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-8">Looks like you haven't made your first purchase yet.</p>
            <Link href="/products" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3 sm:space-y-5">
            {orders.map((order: any, idx: number) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={order._id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-[15px] sm:text-base">
                      {STATUS_ICONS[order.status] || '📦'}
                    </div>
                    <div>
                      <p className="text-[13px] sm:text-sm text-gray-800 font-semibold">Order #{order.orderNumber}</p>
                      <p className="text-[11px] sm:text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'} capitalize`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Order Items */}
                <div className="p-3 sm:p-5">
                  <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4 overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-[56px] sm:min-w-[70px]">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 relative group-hover:border-indigo-100 transition-colors">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-base sm:text-xl text-gray-300">📦</div>
                          )}
                          {item.qty > 1 && (
                            <div className="absolute -top-1 -right-1 bg-gray-800 text-white text-[9px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full font-bold border-2 border-white shadow-sm">
                              {item.qty}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] sm:text-[11px] text-gray-500 font-medium truncate w-14 sm:w-16 text-center">{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Actions */}
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wider font-semibold">Total</p>
                      <p className="font-extrabold text-gray-900 text-[17px] sm:text-lg">₹{order.total?.toLocaleString('en-IN')}</p>
                    </div>

                    <Link
                      href={`/orders/${order._id}`}
                      className="bg-gray-900 text-white px-4 sm:px-6 py-2.5 rounded-xl text-[13px] sm:text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm flex items-center gap-1.5 sm:gap-2"
                    >
                      <span>Track Order</span>
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
