'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

interface Product { _id: string; name: string; sku: string; sellingPrice: number; mrp: number; stock: number; status: string; category?: { name: string }; brand?: { name: string }; }
interface Category { _id: string; name: string; }
interface Brand { _id: string; name: string; }

const emptyForm = { name: '', sku: '', slug: '', mrp: '', sellingPrice: '', stock: '0', category: '', brand: '', description: '', shortDescription: '', status: 'active', isFeatured: false, isNewArrival: false, isBestSeller: false };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cats, setCats] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState('');

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: '20', status: 'active' });
    if (q) params.set('q', q);
    const data = await fetch(`${API}/products?${params}`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setProducts(data.items || []);
    setTotal(data.total || 0);
  }

  useEffect(() => { load(); }, [page, q]);
  useEffect(() => {
    fetch(`${API}/categories`).then(r => r.json()).then(setCats);
    fetch(`${API}/brands`).then(r => r.json()).then(setBrands);
  }, []);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function save() {
    const url = editing ? `${API}/products/${editing}` : `${API}/products`;
    const body = { ...form, mrp: Number(form.mrp), sellingPrice: Number(form.sellingPrice), stock: Number(form.stock), category: form.category || undefined, brand: form.brand || undefined };
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json(); alert(e.error); return; }
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete product?')) return;
    await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Product</button>
      </div>

      <input placeholder="Search products..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
        className="mb-4 border rounded-lg px-3 py-2 text-sm w-full max-w-sm" />

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-3 max-w-2xl">
          <h2 className="col-span-2 font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Product</h2>
          <input placeholder="Product Name" value={form.name}
            onChange={e => setForm((f: any) => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
            className="col-span-2 border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="SKU" value={form.sku} onChange={e => setForm((f: any) => ({ ...f, sku: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Slug" value={form.slug} onChange={e => setForm((f: any) => ({ ...f, slug: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="MRP" type="number" value={form.mrp} onChange={e => setForm((f: any) => ({ ...f, mrp: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Selling Price" type="number" value={form.sellingPrice} onChange={e => setForm((f: any) => ({ ...f, sellingPrice: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Stock" type="number" value={form.stock} onChange={e => setForm((f: any) => ({ ...f, stock: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm" />
          <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
          <select value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Select Category</option>
            {cats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={form.brand} onChange={e => setForm((f: any) => ({ ...f, brand: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Select Brand</option>
            {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <textarea placeholder="Short Description" value={form.shortDescription}
            onChange={e => setForm((f: any) => ({ ...f, shortDescription: e.target.value }))}
            className="col-span-2 border rounded-lg px-3 py-2 text-sm" rows={2} />
          <textarea placeholder="Description" value={form.description}
            onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
            className="col-span-2 border rounded-lg px-3 py-2 text-sm" rows={3} />
          <div className="col-span-2 flex gap-4 text-sm">
            {(['isFeatured', 'isNewArrival', 'isBestSeller'] as const).map(k => (
              <label key={k} className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={form[k]} onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.checked }))} />
                {k.replace('is', '')}
              </label>
            ))}
          </div>
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
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">MRP</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                <td className="px-4 py-3 text-gray-500">{p.category?.name || '—'}</td>
                <td className="px-4 py-3">₹{p.mrp}</td>
                <td className="px-4 py-3 text-green-600 font-medium">₹{p.sellingPrice}</td>
                <td className="px-4 py-3">
                  <span className={p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-yellow-500' : 'text-gray-700'}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => del(p._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No products yet</td></tr>}
          </tbody>
        </table>
        {total > 20 && (
          <div className="flex justify-between items-center px-4 py-3 border-t text-sm text-gray-600">
            <span>{total} total</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
