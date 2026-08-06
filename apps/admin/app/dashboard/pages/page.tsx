'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');
const empty = { title: '', slug: '', content: '', metaTitle: '', metaDescription: '', isActive: true };

export default function AdminPagesPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await fetch(`${API}/pages`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setPages(data);
  }

  useEffect(() => { load(); }, []);

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function save() {
    const url = editing ? `${API}/pages/${editing}` : `${API}/pages`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const e = await res.json(); alert(e.error); return; }
    setForm(empty); setEditing(null); setShowForm(false); load();
  }

  async function del(id: string) {
    if (!confirm('Delete page?')) return;
    await fetch(`${API}/pages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">CMS Pages</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ New Page</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 space-y-3 max-w-2xl">
          <h2 className="font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Page</h2>
          <input placeholder="Title" value={form.title}
            onChange={e => setForm((f: any) => ({ ...f, title: e.target.value, slug: editing ? f.slug : autoSlug(e.target.value) }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Slug (e.g. about, privacy)" value={form.slug}
            onChange={e => setForm((f: any) => ({ ...f, slug: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea placeholder="Content (HTML supported)" value={form.content}
            onChange={e => setForm((f: any) => ({ ...f, content: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono" rows={8} />
          <input placeholder="Meta Title (SEO)" value={form.metaTitle}
            onChange={e => setForm((f: any) => ({ ...f, metaTitle: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Meta Description (SEO)" value={form.metaDescription}
            onChange={e => setForm((f: any) => ({ ...f, metaDescription: e.target.value }))}
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
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">URL</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pages.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.slug}</td>
                <td className="px-4 py-3">
                  <a href={`/pages/${p.slug}`} target="_blank" className="text-blue-600 hover:underline text-xs">/pages/{p.slug}</a>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => { setForm(p); setEditing(p._id); setShowForm(true); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => del(p._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No pages yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
