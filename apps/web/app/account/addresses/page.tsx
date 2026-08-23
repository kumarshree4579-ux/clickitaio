'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Link from 'next/link';

import API from '../../../lib/api';
import { apiFetch } from '../../../lib/apiFetch';
const token = () => localStorage.getItem('token');

const empty = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', isDefault: false };

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token()) { router.push('/login'); return; }
    load();
  }, []);

  async function load() {
    const data = await apiFetch('/addresses').then(r => r.json());
    setAddresses(Array.isArray(data) ? data : []);
  }

  async function save() {
    setSaving(true);
    const res = await apiFetch(editing ? `/addresses/${editing}` : '/addresses', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { const e = await res.json(); alert(e.error); return; }
    setForm(empty); setEditing(null); setShowForm(false); load();
  }

  async function del(id: string) {
    if (!confirm('Delete address?')) return;
    await apiFetch(`/addresses/${id}`, { method: 'DELETE' });
    load();
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-2.5 sm:px-4 py-5 sm:py-8 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/account" className="text-xs sm:text-sm text-indigo-600 hover:underline flex items-center gap-1 mb-1">← Account</Link>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Saved Addresses</h1>
          </div>
          <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}
            className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-indigo-700">+ Add</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-5 space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">{editing ? 'Edit' : 'New'} Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Full Name</label><input className={inp} value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Phone</label><input className={inp} value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-500 mb-1 block">Address Line 1</label><input className={inp} value={form.line1} onChange={e => setForm((f: any) => ({ ...f, line1: e.target.value }))} /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-500 mb-1 block">Address Line 2 (optional)</label><input className={inp} value={form.line2} onChange={e => setForm((f: any) => ({ ...f, line2: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">City</label><input className={inp} value={form.city} onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">State</label><input className={inp} value={form.state} onChange={e => setForm((f: any) => ({ ...f, state: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Pincode</label><input className={inp} value={form.pincode} onChange={e => setForm((f: any) => ({ ...f, pincode: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Country</label><input className={inp} value={form.country} onChange={e => setForm((f: any) => ({ ...f, country: e.target.value }))} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm((f: any) => ({ ...f, isDefault: e.target.checked }))} className="accent-indigo-600" />
              Set as default address
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={saving} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Address'}
              </button>
              <button onClick={() => setShowForm(false)} className="border px-5 py-2 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2.5 sm:space-y-3">
          {addresses.map(a => (
            <div key={a._id} className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-5 flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{a.name}</p>
                  {a.isDefault && <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium shrink-0">Default</span>}
                </div>
                <p className="text-xs sm:text-sm text-gray-500">{a.phone}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} - {a.pincode}</p>
              </div>
              <div className="flex gap-2 sm:gap-3 shrink-0">
                <button onClick={() => { setForm({ ...a }); setEditing(a._id); setShowForm(true); }}
                  className="text-indigo-600 hover:underline text-[11px] sm:text-xs">Edit</button>
                <button onClick={() => del(a._id)} className="text-red-500 hover:underline text-[11px] sm:text-xs">Delete</button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && !showForm && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
              <p className="text-3xl mb-3">📍</p>
              <p>No saved addresses yet</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
