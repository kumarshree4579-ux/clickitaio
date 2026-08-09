'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Link from 'next/link';

import API from '../../lib/api';

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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setOrders(d.items || [])).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="mb-4">No orders yet</p>
            <Link href="/products" className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Link key={order._id} href={`/orders/${order._id}`}
                className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex gap-2 mb-3 overflow-hidden">
                  {order.items.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>}
                    </div>
                  ))}
                  {order.items.length > 3 && <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">+{order.items.length - 3}</div>}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{order.items.reduce((s: number, i: any) => s + i.qty, 0)} items</span>
                  <span className="font-bold text-gray-800">₹{order.total}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
