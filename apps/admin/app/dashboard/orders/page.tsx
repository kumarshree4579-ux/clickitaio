'use client';
import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import API from '../../../lib/api';
import { apiFetch } from '../../../lib/apiFetch';
import { exportToCSV } from '../../../lib/exportCsv';

const STATUSES = [
  'pending', 'received', 'confirmed', 'accepted', 'processing',
  'packing', 'packed', 'assigned_delivery', 'shipped', 'out_for_delivery',
  'delivered', 'completed', 'cancelled', 'returned', 'refunded', 'abandoned'
];

const NEXT_STEP: Record<string, string> = {
  pending: 'received',
  received: 'accepted',
  accepted: 'processing',
  confirmed: 'processing',
  processing: 'packing',
  packing: 'packed',
  packed: 'assigned_delivery',
  assigned_delivery: 'out_for_delivery',
  shipped: 'out_for_delivery',
  out_for_delivery: 'completed',
  delivered: 'completed'
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  received: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  packing: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-indigo-100 text-indigo-700',
  assigned_delivery: 'bg-orange-100 text-orange-700',
  shipped: 'bg-orange-100 text-orange-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-600',
  refunded: 'bg-gray-100 text-gray-600',
  abandoned: 'bg-gray-200 text-gray-500'
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStatus = searchParams.get('status') || '';

  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Tabs inside the slide-over
  const [slideOverTab, setSlideOverTab] = useState<'summary' | 'kot' | 'edit'>('summary');
  const lastOrderIdRef = useRef<string | null>(null);

  async function load(isPolling = false) {
    if (!isPolling) setLoading(true);
    let url = `/orders?page=${page}&limit=20`;
    if (currentStatus) {
      url += `&status=${currentStatus}`;
    }
    try {
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // Check for new orders to trigger notification
        if (page === 1 && (!currentStatus || currentStatus === 'pending') && data.items?.length > 0) {
          const latestId = data.items[0]._id;
          if (lastOrderIdRef.current && lastOrderIdRef.current !== latestId) {
            // Play notification sound
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(e => console.log('Audio play blocked', e));
            } catch(e) {}
          }
          lastOrderIdRef.current = latestId;
        }
        
        setOrders(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, currentStatus]);
  useEffect(() => { setPage(1); }, [currentStatus]);

  // Real-time EventSource reload
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    
    const es = new EventSource(`${API}/stream?token=${token}`);
    
    es.addEventListener('new_order', () => {
      // Reload the orders when a new one arrives
      if (page === 1) load(true);
    });
    
    // Also fallback interval just in case
    const interval = setInterval(() => load(true), 30000);
    
    return () => {
      es.close();
      clearInterval(interval);
    };
  }, [page, currentStatus]);

  async function updateStatus(statusToSet = newStatus, note = '') {
    if (!selected || !statusToSet) return;
    await apiFetch(`/orders/${selected._id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusToSet, note }),
    });
    setSelected({ ...selected, status: statusToSet });
    setNewStatus(statusToSet);
    load();
  }

  async function handleExport() {
    setLoading(true);
    try {
      let url = `/orders?limit=1000`;
      if (currentStatus) url += `&status=${currentStatus}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      exportToCSV(`orders_export_${currentStatus || 'all'}`, data.items || []);
    } catch (err) {
      alert('Failed to export orders');
    } finally {
      setLoading(false);
    }
  }

  const activeLabel = currentStatus ? currentStatus.replace(/_/g, ' ') : 'All Orders';

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeLabel}</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your {activeLabel.toLowerCase()}</p>
        </div>
        <button onClick={handleExport} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Order #</th>
                <th className="px-5 py-4 text-left font-semibold">Customer</th>
                <th className="px-5 py-4 text-left font-semibold">Items</th>
                <th className="px-5 py-4 text-left font-semibold">Total</th>
                <th className="px-5 py-4 text-left font-semibold">Payment</th>
                <th className="px-5 py-4 text-left font-semibold">Status</th>
                <th className="px-5 py-4 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading orders...</td></tr>
              ) : orders.map(o => (
                <tr key={o._id} 
                  onClick={() => { setSelected(o); setNewStatus(o.status); setSlideOverTab('summary'); }}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors group">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600 group-hover:text-indigo-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{o.customer?.name || o.customer?.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{o.items?.length} items</td>
                  <td className="px-4 py-3 font-bold text-gray-800">₹{o.total}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-medium">{new Date(o.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
              {!loading && orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 font-medium">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
        
        {total > 20 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
            <span className="text-sm font-medium text-gray-500">{total} total orders</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Order Details */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform animate-slide-in">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-gray-900">Order #{selected.orderNumber}</h2>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${STATUS_COLOR[selected.status] || 'bg-gray-100 text-gray-600'}`}>
                    {selected.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 font-medium">{new Date(selected.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={`${API}/invoices/${selected._id}`}
                  onClick={e => {
                    e.preventDefault();
                    apiFetch(`/invoices/${selected._id}`)
                      .then(r => r.text()).then(html => {
                        const w = window.open('', '_blank');
                        w?.document.write(html);
                        w?.document.close();
                      });
                  }}
                  className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Invoice
                </a>
                <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 shrink-0">
              {[
                { id: 'summary', label: 'Order Summary' },
                { id: 'kot', label: 'KOT (Kitchen)' },
                { id: 'edit', label: 'Edit Order' }
              ].map(t => (
                <button key={t.id} onClick={() => setSlideOverTab(t.id as any)}
                  className={`px-4 py-3 text-sm font-bold tracking-wide uppercase transition-colors border-b-2 ${slideOverTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              
              {/* SUMMARY TAB */}
              {slideOverTab === 'summary' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Details</h3>
                      <p className="font-bold text-gray-800">{selected.customer?.name || 'Guest User'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selected.customer?.email || '—'}</p>
                      <p className="text-sm text-gray-600">{selected.customer?.phone || selected.address?.phone || '—'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Address</h3>
                      <p className="font-semibold text-gray-800">{selected.address?.name || '—'}</p>
                      <p className="text-sm text-gray-600 mt-1">{selected.address?.line1} {selected.address?.line2}</p>
                      <p className="text-sm text-gray-600">{selected.address?.city}, {selected.address?.state} {selected.address?.pincode}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                      <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Order Items</h3>
                    </div>
                    <ul className="divide-y divide-gray-50">
                      {selected.items?.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-center gap-4 p-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 border border-gray-200 overflow-hidden">
                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">₹{item.price}</p>
                            <p className="text-xs font-semibold text-gray-500">Qty: {item.qty}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-gray-50/50 p-4 border-t border-gray-100 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Subtotal</span><span className="font-bold text-gray-700">₹{selected.subtotal}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Shipping</span><span className="font-bold text-gray-700">₹{selected.shippingCharge}</span></div>
                      {selected.discount > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-600 font-medium">Discount</span><span className="font-bold text-emerald-600">-₹{selected.discount}</span></div>}
                      <div className="pt-2 border-t border-gray-200 flex justify-between"><span className="font-extrabold text-gray-900">Total</span><span className="font-extrabold text-indigo-600 text-lg">₹{selected.total}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* KOT TAB */}
              {slideOverTab === 'kot' && (
                <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 shadow-sm max-w-sm mx-auto font-mono text-sm relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                     <button className="p-2 bg-white rounded-lg shadow-sm text-gray-600 hover:text-indigo-600 border border-yellow-200 transition-colors" title="Print KOT">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                     </button>
                  </div>
                  <h3 className="text-center font-bold text-lg mb-1 border-b border-yellow-300 pb-2">KOT TICKET</h3>
                  <p className="mt-3"><strong>Order:</strong> #{selected.orderNumber}</p>
                  <p><strong>Date:</strong> {new Date(selected.createdAt).toLocaleString('en-IN')}</p>
                  <div className="my-4 border-t border-dashed border-yellow-400" />
                  <table className="w-full text-left">
                    <thead><tr><th className="pb-2">Item</th><th className="pb-2 text-right">Qty</th></tr></thead>
                    <tbody>
                      {selected.items?.map((item: any, idx: number) => (
                        <tr key={idx}><td className="py-1 pr-4">{item.name}</td><td className="py-1 text-right font-bold text-lg">x{item.qty}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="my-4 border-t border-dashed border-yellow-400" />
                  <p><strong>Notes:</strong> {selected.notes || 'None'}</p>
                </div>
              )}

              {/* EDIT TAB */}
              {slideOverTab === 'edit' && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Edit Order UI Placeholder</h3>
                  <p className="text-gray-500 text-sm mt-2 max-w-sm">Full backend recalculation for taxes, discounts, and payments is required to safely edit paid orders. This UI is ready for the next integration phase.</p>
                  <button className="mt-6 bg-gray-100 text-gray-500 px-6 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed">Edit Feature Locked</button>
                </div>
              )}
            </div>

            {/* Footer / Status Actions */}
            <div className="p-4 border-t border-gray-100 bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3">
              {['pending', 'received', 'confirmed'].includes(selected.status) ? (
                <div className="flex gap-3">
                  <button onClick={() => updateStatus('accepted')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-extrabold uppercase tracking-widest transition-all shadow-sm">
                    Accept Order
                  </button>
                  <button onClick={() => {
                    const remark = window.prompt("Enter rejection remark for the customer (e.g., Out of stock):");
                    if (remark !== null) updateStatus('cancelled', remark);
                  }} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-extrabold uppercase tracking-widest transition-all shadow-sm">
                    Reject Order
                  </button>
                </div>
              ) : NEXT_STEP[selected.status] && (
                <button 
                  onClick={() => updateStatus(NEXT_STEP[selected.status])} 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-extrabold uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2">
                  <span>Mark as {NEXT_STEP[selected.status].replace(/_/g, ' ')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              )}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Manual Update</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none capitalize">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <button onClick={() => updateStatus(newStatus)} disabled={newStatus === selected.status}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Save
                </button>
              </div>
            </div>

          </div>
        </>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-bold">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
