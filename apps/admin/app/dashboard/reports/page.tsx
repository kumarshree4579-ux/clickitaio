'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token()}` };
    fetch(`${API}/reports/summary`, { headers: h }).then(r => r.json()).then(setSummary);
    fetch(`${API}/reports/top-products?limit=10`, { headers: h }).then(r => r.json()).then(setTopProducts);
  }, []);

  useEffect(() => {
    fetch(`${API}/reports/sales?days=${days}`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()).then(setSales);
  }, [days]);

  if (!summary) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  const maxRevenue = Math.max(...sales.map(s => s.revenue), 1);

  const statCards = [
    { label: "Today's Orders", value: summary.today.orders, icon: '📦', color: 'bg-blue-500' },
    // { label: "Today's Revenue", value: `₹${summary.today.sales.toLocaleString()}`, icon: '💰', color: 'bg-green-500' },
    { label: "Month Orders", value: summary.month.orders, icon: '📅', color: 'bg-purple-500' },
    { label: "Month Revenue", value: `₹${summary.month.sales.toLocaleString()}`, icon: '📈', color: 'bg-orange-500' },
    { label: 'Pending Orders', value: summary.orders.pending, icon: '⏳', color: 'bg-yellow-500' },
    { label: 'Delivered', value: summary.orders.delivered, icon: '✅', color: 'bg-teal-500' },
    { label: 'Cancelled', value: summary.orders.cancelled, icon: '❌', color: 'bg-red-500' },
    { label: 'Total Customers', value: summary.customers, icon: '👥', color: 'bg-indigo-500' },
    { label: 'Active Products', value: summary.products.total, icon: '🛍️', color: 'bg-pink-500' },
    { label: 'Out of Stock', value: summary.products.outOfStock, icon: '⚠️', color: 'bg-red-400' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(c => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className={`${c.color} text-white w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0`}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{c.label}</p>
              <p className="font-bold text-gray-800">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Revenue Chart</h2>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${days === d ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        {sales.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No sales data</div>
        ) : (
          <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
            {sales.map(s => (
              <div key={s._id} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
                <div className="text-xs text-gray-500 font-medium">₹{(s.revenue / 1000).toFixed(1)}k</div>
                <div
                  className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-default"
                  style={{ height: `${Math.max((s.revenue / maxRevenue) * 100, 4)}px` }}
                  title={`${s._id}: ₹${s.revenue} (${s.orders} orders)`}
                />
                <div className="text-xs text-gray-400 rotate-45 origin-left whitespace-nowrap" style={{ fontSize: '9px' }}>
                  {s._id.slice(5)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-bold text-gray-800">Top Selling Products</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-right">Units Sold</th>
              <th className="px-4 py-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {topProducts.map((p, i) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-right text-gray-600">{p.totalQty}</td>
                <td className="px-4 py-3 text-right font-bold text-green-600">₹{p.totalRevenue.toLocaleString()}</td>
              </tr>
            ))}
            {topProducts.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No data yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
