'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    Promise.all([
      fetch(`${API}/reports/summary`, { headers: h }).then(r => r.json()),
      fetch(`${API}/reports/top-products?limit=5`, { headers: h }).then(r => r.json()),
      fetch(`${API}/orders?limit=5`, { headers: h }).then(r => r.json()),
    ]).then(([s, tp, o]) => {
      setSummary(s);
      setTopProducts(tp);
      setRecentOrders(o.items || []);
    }).catch(() => {});
  }, []);

  if (!summary) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  const statCards = [
    { label: "Today's Orders", value: summary.today.orders, icon: '📦', color: 'bg-blue-500', href: '/dashboard/orders' },
    { label: "Today's Revenue", value: `₹${summary.today.sales.toLocaleString('en-IN')}`, icon: '💰', color: 'bg-emerald-500', href: '/dashboard/reports' },
    { label: 'Month Orders', value: summary.month.orders, icon: '📅', color: 'bg-violet-500', href: '/dashboard/orders' },
    { label: 'Month Revenue', value: `₹${summary.month.sales.toLocaleString('en-IN')}`, icon: '📈', color: 'bg-orange-500', href: '/dashboard/reports' },
    { label: 'Pending Orders', value: summary.orders.pending, icon: '⏳', color: 'bg-yellow-500', href: '/dashboard/orders' },
    { label: 'Delivered', value: summary.orders.delivered, icon: '✅', color: 'bg-teal-500', href: '/dashboard/orders' },
    { label: 'Cancelled', value: summary.orders.cancelled, icon: '❌', color: 'bg-red-500', href: '/dashboard/orders' },
    { label: 'Total Customers', value: summary.customers, icon: '👥', color: 'bg-indigo-500', href: '/dashboard/customers' },
    { label: 'Active Products', value: summary.products.total, icon: '🛍️', color: 'bg-pink-500', href: '/dashboard/products' },
    { label: 'Out of Stock', value: summary.products.outOfStock, icon: '⚠️', color: 'bg-red-400', href: '/dashboard/inventory' },
  ];

  const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
    packed: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700',
    out_for_delivery: 'bg-orange-100 text-orange-700', delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(c => (
          <Link key={c.label} href={c.href}
            className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`${c.color} text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0`}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{c.label}</p>
              <p className="font-bold text-gray-800 text-lg leading-tight">{c.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-bold text-gray-800">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {recentOrders.map((o: any) => (
              <div key={o._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">#{o.orderNumber}</p>
                  <p className="text-xs text-gray-500">{o.customer?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">₹{o.total?.toLocaleString('en-IN')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No orders yet</p>}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-bold text-gray-800">Top Products</h2>
            <Link href="/dashboard/reports" className="text-xs text-blue-600 hover:underline">Full report</Link>
          </div>
          <div className="divide-y">
            {topProducts.map((p: any, i: number) => (
              <div key={p._id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.totalQty} units sold</p>
                </div>
                <p className="text-sm font-bold text-emerald-600">₹{p.totalRevenue?.toLocaleString()}</p>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No sales data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
