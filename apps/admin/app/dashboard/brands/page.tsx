'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

interface Brand { _id: string; name: string; slug: string; website?: string; isActive: boolean; }

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', website: '', description: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await fetch(`${API}/brands`).then(r => r.json());
    setBrands(data);
  }

  useEffect(() => { load(); }, []);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function save() {
    const url = editing ? `${API}/brands/${editing}` : `${API}/brands`;
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    });
    setForm({ name: '', slug: '', website: '', description: '' });
    setEditing(null);
    setShowForm(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete?')) return;
    await fetch(`${API}/brands/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Brands</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', slug: '', website: '', description: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Brand</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 space-y-3 max-w-lg">
          <h2 className="font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Brand</h2>
          <input placeholder="Name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Slug" value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Website" value={form.website}
            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Description" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Save</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Website</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {brands.map(b => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-gray-500">{b.slug}</td>
                <td className="px-4 py-3 text-gray-500">{b.website || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => { setForm({ name: b.name, slug: b.slug, website: b.website || '', description: '' }); setEditing(b._id); setShowForm(true); }}
                    className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => del(b._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {brands.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No brands yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
