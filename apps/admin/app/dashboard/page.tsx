'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [runningOrders, setRunningOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);

  const fetchDashboardData = useCallback(() => {
    Promise.all([
      apiFetch(`/reports/summary`).then(r => r.json()),
      apiFetch(`/orders?limit=5&status=pending,received,confirmed`).then(r => r.json()),
      apiFetch(`/orders?limit=5&status=running`).then(r => r.json()),
      apiFetch(`/orders?limit=5&status=completed`).then(r => r.json()),
      apiFetch(`/orders?limit=5&status=cancelled`).then(r => r.json()),
      apiFetch(`/reports/low-stock-products?limit=5`).then(r => r.json()),
      apiFetch(`/auth/customers?limit=5`).then(r => r.json()),
    ]).then(([s, no, ro, co, ca, ls, rc]) => {
      setSummary(s);
      setNewOrders(no.items || []);
      setRunningOrders(ro.items || []);
      setCompletedOrders(co.items || []);
      setCancelledOrders(ca.items || []);
      setLowStock(ls || []);
      setRecentCustomers(rc.items || []);
    }).catch(() => { });
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh when SSE sends a new order or order status update
  useEffect(() => {
    const handleNewOrder = () => fetchDashboardData();
    const handleStatusUpdate = () => fetchDashboardData();

    window.addEventListener('admin:new_order', handleNewOrder);
    window.addEventListener('admin:order_status_update', handleStatusUpdate);

    return () => {
      window.removeEventListener('admin:new_order', handleNewOrder);
      window.removeEventListener('admin:order_status_update', handleStatusUpdate);
    };
  }, [fetchDashboardData]);

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
    { label: 'Active Orders', value: summary.orders.active, icon: '🔄', color: 'bg-amber-500', href: '/dashboard/orders' },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Orders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col max-h-96">
          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
            <h2 className="font-bold text-gray-800">New Orders</h2>
            <Link href="/dashboard/orders?status=pending,received,confirmed" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y overflow-y-auto flex-1">
            {newOrders.map((o: any) => (
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
            {newOrders.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No new orders yet</p>}
          </div>
        </div>

        {/* Running Orders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col max-h-96">
          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
            <h2 className="font-bold text-gray-800">Running Orders</h2>
            <Link href="/dashboard/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y overflow-y-auto flex-1">
            {runningOrders.map((o: any) => (
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
            {runningOrders.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No running orders</p>}
          </div>
        </div>
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-red-100 flex flex-col max-h-96">
          <div className="flex items-center justify-between px-5 py-4 border-b bg-red-50/30 shrink-0">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="text-red-500 text-lg leading-none">⚠️</span> Low Stock
            </h2>
            <Link href="/dashboard/inventory" className="text-xs text-blue-600 hover:underline">Manage</Link>
          </div>
          <div className="divide-y overflow-y-auto flex-1">
            {lowStock.map((p: any) => (
              <div key={p._id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">Min required: {p.minStock || 0}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-600">{p.stock} left</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm flex flex-col items-center">
                <span className="text-emerald-500 text-2xl mb-1">✓</span>
                All stocks are healthy
              </div>
            )}
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col max-h-96">
          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
            <h2 className="font-bold text-gray-800">Completed Orders</h2>
            <Link href="/dashboard/orders?status=completed" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y overflow-y-auto flex-1">
            {completedOrders.map((o: any) => (
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
            {completedOrders.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No completed orders yet</p>}
          </div>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col max-h-96">
          <div className="flex items-center justify-between px-5 py-4 border-b bg-red-50/50 shrink-0">
            <h2 className="font-bold text-gray-800">Cancelled Orders</h2>
            <Link href="/dashboard/orders?status=cancelled" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y overflow-y-auto flex-1">
            {cancelledOrders.map((o: any) => (
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
            {cancelledOrders.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No cancelled orders yet</p>}
          </div>
        </div>



        {/* Recent Customers */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col max-h-96">
          <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
            <h2 className="font-bold text-gray-800">Recent Customers</h2>
            <Link href="/dashboard/customers" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y overflow-y-auto flex-1">
            {recentCustomers.map((c: any) => (
              <div key={c._id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{c.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-gray-400">{new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
            {recentCustomers.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No customers yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
