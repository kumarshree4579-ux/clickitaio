'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');
const TYPES = ['slider', 'offer', 'category', 'popup', 'mobile'];
const empty = { title: '', image: '', link: '', type: 'slider', sortOrder: '0', isActive: true };

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await fetch(`${API}/banners/admin`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setBanners(data);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    const url = editing ? `${API}/banners/${editing}` : `${API}/banners`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
    });
    if (!res.ok) { const e = await res.json(); alert(e.error); return; }
    setForm(empty); setEditing(null); setShowForm(false); load();
  }

  async function del(id: string) {
    if (!confirm('Delete banner?')) return;
    await fetch(`${API}/banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  async function toggle(b: any) {
    await fetch(`${API}/banners/${b._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ isActive: !b.isActive }) });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Banners</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Banner</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 space-y-3 max-w-lg">
          <h2 className="font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Banner</h2>
          <input placeholder="Title" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Image URL" value={form.image} onChange={e => setForm((f: any) => ({ ...f, image: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Link URL (optional)" value={form.link} onChange={e => setForm((f: any) => ({ ...f, link: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm">
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <input placeholder="Sort Order" type="number" value={form.sortOrder} onChange={e => setForm((f: any) => ({ ...f, sortOrder: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          {form.image && <img src={form.image} alt="preview" className="w-full h-32 object-cover rounded-lg" onError={e => (e.currentTarget.style.display = 'none')} />}
          <div className="flex gap-2">
            <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Save</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map(b => (
          <div key={b._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              {b.image ? <img src={b.image} alt={b.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🖼️</div>}
              <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full capitalize">{b.type}</span>
            </div>
            <div className="p-3">
              <p className="font-medium text-gray-800 text-sm">{b.title}</p>
              {b.link && <p className="text-xs text-gray-400 truncate">{b.link}</p>}
              <div className="flex items-center justify-between mt-2">
                <button onClick={() => toggle(b)} className={`px-2 py-0.5 rounded-full text-xs ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setForm({ ...b, sortOrder: String(b.sortOrder) }); setEditing(b._id); setShowForm(true); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => del(b._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No banners yet</div>}
      </div>
    </div>
  );
}
