'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token()) { router.push('/login'); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await apiFetch('/addresses').then(r => r.json());
    setAddresses(Array.isArray(data) ? data : []);
    setLoading(false);
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
    if (!confirm('Delete this address?')) return;
    await apiFetch(`/addresses/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24 sm:pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/account" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-[17px] font-bold text-gray-900">My Addresses</h1>
          </div>
          {!showForm && (
            <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}
              className="bg-primary text-white px-3.5 py-2 rounded-lg text-[13px] font-bold hover:bg-primary-dark active:scale-95 transition-all">
              + Add New
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-3">

        {/* ─── Add/Edit Form ─── */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-900 text-[15px]">{editing ? 'Edit Address' : 'Add New Address'}</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Full Name *</label>
                  <input
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Phone Number *</label>
                  <input
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Address Line 1 *</label>
                <input
                  placeholder="House/Flat no., Building, Street"
                  value={form.line1}
                  onChange={e => setForm((f: any) => ({ ...f, line1: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Address Line 2</label>
                <input
                  placeholder="Landmark, Area (optional)"
                  value={form.line2}
                  onChange={e => setForm((f: any) => ({ ...f, line2: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">City *</label>
                  <input
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">State *</label>
                  <input
                    placeholder="Maharashtra"
                    value={form.state}
                    onChange={e => setForm((f: any) => ({ ...f, state: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Pincode *</label>
                  <input
                    placeholder="400001"
                    value={form.pincode}
                    onChange={e => setForm((f: any) => ({ ...f, pincode: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">Country</label>
                  <input
                    value={form.country}
                    onChange={e => setForm((f: any) => ({ ...f, country: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-gray-50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm((f: any) => ({ ...f, isDefault: e.target.checked }))} className="w-4 h-4 accent-primary rounded" />
                <span className="text-[14px] text-gray-700 font-medium">Set as default address</span>
              </label>
            </div>

            {/* Actions — sticky at bottom on mobile */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white sticky bottom-0 flex gap-2.5 rounded-b-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
              <button onClick={save} disabled={saving}
                className="flex-1 bg-primary text-white py-3.5 rounded-xl text-[15px] font-bold hover:bg-primary-dark disabled:opacity-50 active:scale-[0.98] transition-all">
                {saving ? 'Saving...' : editing ? 'Update Address' : 'Save Address'}
              </button>
              <button onClick={() => { setShowForm(false); setForm(empty); setEditing(null); }}
                className="px-5 py-3.5 rounded-xl text-[14px] font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ─── Address List ─── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-4 w-14 bg-gray-100 rounded-full" />
                </div>
                <div className="h-3.5 w-32 bg-gray-100 rounded mt-1" />
                <div className="h-3.5 w-48 bg-gray-100 rounded mt-1.5" />
              </div>
            ))}
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-800 font-semibold text-[15px]">No addresses yet</p>
            <p className="text-gray-400 text-[13px] mt-1">Add your first delivery address</p>
            <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}
              className="mt-5 bg-primary text-white px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-primary-dark active:scale-95 transition-all">
              + Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {addresses.map(a => (
              <div key={a._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900 text-[14px]">{a.name}</p>
                        {a.isDefault && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide border border-emerald-100">Default</span>
                        )}
                      </div>
                      <p className="text-[13px] text-gray-500 font-medium">{a.phone}</p>
                      <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">
                        {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                        {a.city}, {a.state} — <span className="font-semibold">{a.pincode}</span>
                      </p>
                    </div>
                  </div>
                </div>
                {/* Action bar */}
                <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                  <button
                    onClick={() => { setForm({ ...a }); setEditing(a._id); setShowForm(true); window.scrollTo({ top: 0 }); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-primary hover:bg-primary-light active:bg-primary-light transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit
                  </button>
                  <button
                    onClick={() => del(a._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
