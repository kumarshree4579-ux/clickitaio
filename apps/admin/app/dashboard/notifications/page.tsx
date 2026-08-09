'use client';
import { useEffect, useState } from 'react';

import API from '../../../lib/api';
const token = () => localStorage.getItem('token');

const TYPES = ['info', 'success', 'warning', 'error'] as const;
const TYPE_STYLES: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
};

const empty = { message: '', type: 'info', link: '', linkText: '', isActive: true, startsAt: '', endsAt: '' };

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await fetch(`${API}/notifications/admin`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    const url = editing ? `${API}/notifications/${editing}` : `${API}/notifications`;
    const body = { ...form, startsAt: form.startsAt || undefined, endsAt: form.endsAt || undefined };
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json(); alert(e.error); return; }
    setForm(empty); setEditing(null); setShowForm(false); load();
  }

  async function del(id: string) {
    if (!confirm('Delete notification?')) return;
    await fetch(`${API}/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  async function toggle(n: any) {
    await fetch(`${API}/notifications/${n._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ isActive: !n.isActive }),
    });
    load();
  }

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Site Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Notification banners shown to all visitors on the storefront</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ Add Notification</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 max-w-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Notification</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Message *</label>
            <textarea className={inp} rows={2} value={form.message}
              onChange={e => setForm((f: any) => ({ ...f, message: e.target.value }))}
              placeholder="e.g. 🎉 Free shipping on all orders this weekend!" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select className={inp} value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 pb-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600" />
                Active
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Link URL (optional)</label>
              <input className={inp} value={form.link} onChange={e => setForm((f: any) => ({ ...f, link: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Link Text</label>
              <input className={inp} value={form.linkText} onChange={e => setForm((f: any) => ({ ...f, linkText: e.target.value }))} placeholder="Shop Now" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Starts At (optional)</label>
              <input type="datetime-local" className={inp} value={form.startsAt} onChange={e => setForm((f: any) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ends At (optional)</label>
              <input type="datetime-local" className={inp} value={form.endsAt} onChange={e => setForm((f: any) => ({ ...f, endsAt: e.target.value }))} />
            </div>
          </div>

          {/* Preview */}
          {form.message && (
            <div className={`rounded-lg px-4 py-2.5 text-sm flex items-center justify-between ${TYPE_STYLES[form.type]}`}>
              <span>{form.message}</span>
              {form.link && form.linkText && <a href={form.link} className="font-semibold underline ml-3 whitespace-nowrap">{form.linkText}</a>}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={save} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Save</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map(n => (
          <div key={n._id} className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-4">
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${TYPE_STYLES[n.type]}`}>
              {n.type}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{n.message}</p>
              {n.link && <p className="text-xs text-gray-400 mt-0.5 truncate">{n.link} {n.linkText && `→ "${n.linkText}"`}</p>}
              {(n.startsAt || n.endsAt) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {n.startsAt && `From: ${new Date(n.startsAt).toLocaleString()}`}
                  {n.startsAt && n.endsAt && ' · '}
                  {n.endsAt && `Until: ${new Date(n.endsAt).toLocaleString()}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => toggle(n)}
                className={`px-2 py-0.5 rounded-full text-xs ${n.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {n.isActive ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => {
                setForm({ ...n, startsAt: n.startsAt ? new Date(n.startsAt).toISOString().slice(0, 16) : '', endsAt: n.endsAt ? new Date(n.endsAt).toISOString().slice(0, 16) : '' });
                setEditing(n._id); setShowForm(true);
              }} className="text-indigo-600 hover:underline text-xs">Edit</button>
              <button onClick={() => del(n._id)} className="text-red-500 hover:underline text-xs">Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl text-gray-400">
            <div className="text-4xl mb-3">🔔</div>
            <p>No notifications yet. Create one to show a banner on the storefront.</p>
          </div>
        )}
      </div>
    </div>
  );
}

