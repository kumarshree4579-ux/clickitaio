'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

interface Category { _id: string; name: string; slug: string; parent?: { name: string } | null; isActive: boolean; }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', parent: '', description: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await fetch(`${API}/categories`).then(r => r.json());
    setCats(data);
  }

  useEffect(() => { load(); }, []);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function save() {
    const url = editing ? `${API}/categories/${editing}` : `${API}/categories`;
    const method = editing ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...form, parent: form.parent || null }),
    });
    setForm({ name: '', slug: '', parent: '', description: '' });
    setEditing(null);
    setShowForm(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete?')) return;
    await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  function edit(c: Category) {
    setForm({ name: c.name, slug: c.slug, parent: '', description: '' });
    setEditing(c._id);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', slug: '', parent: '', description: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Category</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 space-y-3 max-w-lg">
          <h2 className="font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Category</h2>
          <input placeholder="Name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Slug" value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <select value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">No Parent</option>
            {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
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
              <th className="px-4 py-3 text-left">Parent</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cats.map(c => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.slug}</td>
                <td className="px-4 py-3 text-gray-500">{c.parent?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => edit(c)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => del(c._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No categories yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
