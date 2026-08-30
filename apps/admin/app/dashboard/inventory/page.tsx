'use client';
import { useEffect, useState } from 'react';
import { exportToCSV } from '../../../lib/exportCsv';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

interface Product { _id: string; name: string; sku: string; stock: number; minStock: number; status: string; }
interface Movement { _id: string; type: string; qty: number; before: number; after: number; note?: string; reference?: string; createdAt: string; }

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [adjQty, setAdjQty] = useState('');
  const [adjNote, setAdjNote] = useState('');
  const [adjType, setAdjType] = useState('adjustment');
  const [tab, setTab] = useState<'all' | 'low'>('all');
  const [saving, setSaving] = useState(false);

  async function load() {
    const url = tab === 'low' ? `${API}/inventory/low-stock` : `${API}/inventory`;
    const data = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setProducts(data);
  }

  useEffect(() => { load(); }, [tab]);

  async function openProduct(p: Product) {
    setSelected(p);
    setAdjQty(''); setAdjNote(''); setAdjType('adjustment');
    const data = await fetch(`${API}/inventory/${p._id}/movements`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setMovements(data);
  }

  async function adjust() {
    if (!selected || !adjQty) return;
    setSaving(true);
    const res = await fetch(`${API}/inventory/${selected._id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ qty: Number(adjQty), note: adjNote, type: adjType }),
    });
    setSaving(false);
    if (!res.ok) { const e = await res.json(); alert(e.error); return; }
    const { product, movement } = await res.json();
    setSelected({ ...selected, stock: product.stock });
    setMovements(m => [{ _id: Date.now().toString(), type: adjType, qty: Number(adjQty), before: movement.before, after: movement.after, note: adjNote, reference: '', createdAt: new Date().toISOString() }, ...m]);
    setAdjQty(''); setAdjNote('');
    load();
  }

  const TYPE_COLOR: Record<string, string> = {
    purchase: 'text-green-600', sale: 'text-red-500', adjustment: 'text-blue-600',
    return: 'text-yellow-600', transfer: 'text-purple-600',
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left: product list */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <div className="flex gap-2">
            <button onClick={() => exportToCSV('inventory_export', products)} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
            {(['all', 'low'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>
                {t === 'all' ? 'All Stock' : '⚠️ Low Stock'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Min Stock</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p._id} className={`hover:bg-gray-50 ${selected?._id === p._id ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${p.stock === 0 ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-800'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{p.minStock}</td>
                    <td className="px-4 py-3">
                      {p.stock === 0
                        ? <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Out of Stock</span>
                        : isLow
                          ? <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">Low Stock</span>
                          : <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">In Stock</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openProduct(p)} className="text-blue-600 hover:underline text-xs">Adjust</button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No products</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: adjustment panel */}
      {selected && (
        <div className="w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 text-sm">Adjust Stock</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-xs text-gray-500 mb-1">{selected.name}</p>
            <p className="text-2xl font-bold text-gray-800 mb-4">{selected.stock} units</p>

            <div className="space-y-2">
              <select value={adjType} onChange={e => setAdjType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="adjustment">Adjustment</option>
                <option value="purchase">Purchase / Restock</option>
                <option value="return">Customer Return</option>
                <option value="transfer">Transfer</option>
              </select>
              <input type="number" placeholder="Qty (use - to reduce)" value={adjQty}
                onChange={e => setAdjQty(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Note (optional)" value={adjNote}
                onChange={e => setAdjNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              {adjQty && (
                <p className="text-xs text-gray-500">
                  New stock: <strong>{selected.stock + Number(adjQty)}</strong>
                </p>
              )}
              <button onClick={adjust} disabled={saving || !adjQty}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Apply Adjustment'}
              </button>
            </div>
          </div>

          {/* Movement history */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-bold text-gray-800 text-sm mb-3">Movement History</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {movements.map(m => (
                <div key={m._id} className="text-xs border-b pb-2">
                  <div className="flex justify-between">
                    <span className={`font-medium capitalize ${TYPE_COLOR[m.type] || 'text-gray-600'}`}>{m.type}</span>
                    <span className={m.qty > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                      {m.qty > 0 ? '+' : ''}{m.qty}
                    </span>
                  </div>
                  <div className="text-gray-400">{m.before} → {m.after} · {new Date(m.createdAt).toLocaleDateString('en-IN')}</div>
                  {m.note && <div className="text-gray-500 italic">{m.note}</div>}
                  {m.reference && <div className="text-gray-400">Ref: {m.reference}</div>}
                </div>
              ))}
              {movements.length === 0 && <p className="text-gray-400 text-center py-4">No movements yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
