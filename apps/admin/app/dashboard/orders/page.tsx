'use client';
import { useEffect, useState } from 'react';

import API from '../../../lib/api';
const token = () => localStorage.getItem('token');

const STATUSES = ['pending','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned','refunded'];
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700', returned: 'bg-gray-100 text-gray-600', refunded: 'bg-gray-100 text-gray-600',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');

  async function load() {
    const data = await fetch(`${API}/orders?page=${page}&limit=20`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setOrders(data.items || []);
    setTotal(data.total || 0);
  }

  useEffect(() => { load(); }, [page]);

  async function updateStatus() {
    if (!selected || !newStatus) return;
    await fetch(`${API}/orders/${selected._id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ status: newStatus }),
    });
    setSelected(null);
    setNewStatus('');
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-bold text-gray-800">Update Order #{selected.orderNumber}</h2>
            <p className="text-sm text-gray-500">Current: <span className="font-medium">{selected.status}</span></p>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select new status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={updateStatus} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Update</button>
              <button onClick={() => setSelected(null)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Order #</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Items</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(o => (
              <tr key={o._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600">{o.customer?.email || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{o.items?.length} items</td>
                <td className="px-4 py-3 font-medium">₹{o.total}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => { setSelected(o); setNewStatus(o.status); }}
                    className="text-blue-600 hover:underline text-xs">Update</button>
                  <a href={`${API}/invoices/${o._id}`}
                    onClick={e => {
                      e.preventDefault();
                      const t = localStorage.getItem('token');
                      fetch(`${API}/invoices/${o._id}`, { headers: { Authorization: `Bearer ${t}` } })
                        .then(r => r.text()).then(html => {
                          const w = window.open('', '_blank');
                          w?.document.write(html);
                          w?.document.close();
                        });
                    }}
                    className="text-gray-500 hover:underline text-xs">Invoice</a>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>}
          </tbody>
        </table>
        {total > 20 && (
          <div className="flex justify-between items-center px-4 py-3 border-t text-sm text-gray-600">
            <span>{total} total orders</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

