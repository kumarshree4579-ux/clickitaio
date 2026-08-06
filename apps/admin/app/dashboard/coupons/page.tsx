'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

const empty = { code: '', type: 'flat', value: '', minOrderAmount: '0', maxDiscount: '', usageLimit: '', perCustomerLimit: '1', expiresAt: '', description: '', isActive: true };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await fetch(`${API}/coupons`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setCoupons(data);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    const url = editing ? `${API}/coupons/${editing}` : `${API}/coupons`;
    const body = { ...form, value: Number(form.value), minOrderAmount: Number(form.minOrderAmount), perCustomerLimit: Number(form.perCustomerLimit), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined, expiresAt: form.expiresAt || undefined };
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(body) });
    if (!res.ok) { const e = await res.json(); alert(e.error); return; }
    setForm(empty); setEditing(null); setShowForm(false); load();
  }

  async function del(id: string) {
    if (!confirm('Delete coupon?')) return;
    await fetch(`${API}/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  async function toggle(c: any) {
    await fetch(`${API}/coupons/${c._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ isActive: !c.isActive }) });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Create Coupon</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-3 max-w-2xl">
          <h2 className="col-span-2 font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Coupon</h2>
          <input placeholder="Code (e.g. SAVE20)" value={form.code} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))} className="border rounded-lg px-3 py-2 text-sm uppercase" />
          <select value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm">
            <option value="flat">Flat (₹)</option>
            <option value="percentage">Percentage (%)</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
          <input placeholder="Value" type="number" value={form.value} onChange={e => setForm((f: any) => ({ ...f, value: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Min Order Amount" type="number" value={form.minOrderAmount} onChange={e => setForm((f: any) => ({ ...f, minOrderAmount: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Max Discount (optional)" type="number" value={form.maxDiscount} onChange={e => setForm((f: any) => ({ ...f, maxDiscount: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Usage Limit (optional)" type="number" value={form.usageLimit} onChange={e => setForm((f: any) => ({ ...f, usageLimit: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Per Customer Limit" type="number" value={form.perCustomerLimit} onChange={e => setForm((f: any) => ({ ...f, perCustomerLimit: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.expiresAt} onChange={e => setForm((f: any) => ({ ...f, expiresAt: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="col-span-2 border rounded-lg px-3 py-2 text-sm" />
          <div className="col-span-2 flex gap-2">
            <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Save</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Value</th>
              <th className="px-4 py-3 text-left">Min Order</th>
              <th className="px-4 py-3 text-left">Used</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map(c => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold text-blue-600">{c.code}</td>
                <td className="px-4 py-3 capitalize">{c.type.replace('_', ' ')}</td>
                <td className="px-4 py-3">{c.type === 'percentage' ? `${c.value}%` : c.type === 'free_shipping' ? 'Free' : `₹${c.value}`}</td>
                <td className="px-4 py-3">₹{c.minOrderAmount}</td>
                <td className="px-4 py-3 text-gray-500">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(c)} className={`px-2 py-0.5 rounded-full text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => { setForm({ ...c, value: String(c.value), minOrderAmount: String(c.minOrderAmount), maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', usageLimit: c.usageLimit ? String(c.usageLimit) : '', perCustomerLimit: String(c.perCustomerLimit), expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : '' }); setEditing(c._id); setShowForm(true); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => del(c._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No coupons yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
