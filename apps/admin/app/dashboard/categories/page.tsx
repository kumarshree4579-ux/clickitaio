'use client';
import { useEffect, useState } from 'react';

import API from '../../../lib/api';
const token = () => localStorage.getItem('token');

interface Category { _id: string; name: string; slug: string; parent?: { name: string } | null; isActive: boolean; image?: string; }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', parent: '', description: '', image: '' });
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
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...form, parent: form.parent || null }),
    });
    if (!res.ok) { const e = await res.json(); alert(e.error || JSON.stringify(e.details)); return; }
    setForm({ name: '', slug: '', parent: '', description: '', image: '' });
    setEditing(null); setShowForm(false); load();
  }

  async function del(id: string) {
    if (!confirm('Delete?')) return;
    await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  function edit(c: Category) {
    setForm({ name: c.name, slug: c.slug, parent: (c.parent as any)?._id || '', description: (c as any).description || '', image: c.image || '' });
    setEditing(c._id); setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', slug: '', parent: '', description: '', image: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Category</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 space-y-3 max-w-lg">
          <h2 className="font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Category</h2>
          <input placeholder="Name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : autoSlug(e.target.value) }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Slug" value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <select value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">No Parent (Top Level)</option>
            {cats.filter(c => !c.parent).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input placeholder="Description (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="space-y-2">
            <input placeholder="Image URL (optional)" value={form.image}
              onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            {form.image && (
              <div className="flex items-center gap-3">
                <img src={form.image} alt="preview" className="w-16 h-16 object-cover rounded-lg border"
                  onError={e => (e.currentTarget.style.display = 'none')} />
                <p className="text-xs text-gray-500">Image preview</p>
              </div>
            )}
            <p className="text-xs text-gray-400">Leave empty to auto-use first product image from this category</p>
          </div>
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
              <th className="px-4 py-3 text-left">Image</th>
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
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {c.image
                      ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                      : <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    }
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.slug}</td>
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
            {cats.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No categories yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

