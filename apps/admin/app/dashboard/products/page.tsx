'use client';
import { useEffect, useState, useRef } from 'react';

import API from '../../../lib/api';
const token = () => localStorage.getItem('token');

interface Product { _id: string; name: string; sku: string; sellingPrice: number; mrp: number; stock: number; status: string; category?: { name: string }; subCategory?: { name: string }; brand?: { name: string }; images?: { url: string }[]; }
interface Category { _id: string; name: string; parent?: string | { _id: string }; }
interface Brand { _id: string; name: string; }

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    {children}
  </div>
);

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";

function CreatableSelect({ options, value, onChange, placeholder, onAdd, disabled }: any) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o: any) => o._id === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter((o: any) => o.name.toLowerCase().includes(search.toLowerCase()));
  const showAdd = search && !options.find((o: any) => o.name.toLowerCase() === search.toLowerCase());

  return (
    <div className="relative" ref={ref}>
      <div 
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer flex justify-between items-center ${disabled ? 'bg-gray-50 opacity-60 pointer-events-none' : 'bg-white'}`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-500'}>{selected ? selected.name : placeholder}</span>
        <span className="text-gray-400 text-xs">▼</span>
      </div>
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 flex flex-col">
          <div className="p-2 shrink-0 bg-white border-b border-gray-100">
            <input 
              autoFocus
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none"
              placeholder="Search or type to add..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.map((o: any) => (
              <div key={o._id} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                onClick={() => { onChange(o._id); setOpen(false); setSearch(''); }}>
                {o.name}
              </div>
            ))}
            {showAdd && (
              <div className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 cursor-pointer font-medium"
                onClick={async () => {
                  const newCat = await onAdd(search);
                  if (newCat) { onChange(newCat._id); setOpen(false); setSearch(''); }
                }}>
                + Add "{search}"
              </div>
            )}
            {filtered.length === 0 && !showAdd && <div className="px-3 py-2 text-sm text-gray-400">No options</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  name: '', sku: '', slug: '', mrp: '', sellingPrice: '', costPrice: '', gst: '0',
  stock: '0', minStock: '0', category: '', subCategory: '', brand: '', description: '', shortDescription: '',
  status: 'active', isFeatured: false, isNewArrival: false, isBestSeller: false, isTrending: false,
  tags: '', weight: '', warranty: '', returnPolicy: '', metaTitle: '', metaDescription: '',
  images: [] as { url: string; alt?: string }[],
};

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
  const [uploadingCount, setUploadingCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q) params.set('q', q);
    const data = await fetch(`${API}/products?${params}`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setProducts(data.items || []);
    setTotal(data.total || 0);
  }

  useEffect(() => { load(); }, [page, q]);
  useEffect(() => {
    fetch(`${API}/categories`).then(r => r.json()).then(d => setCats(Array.isArray(d) ? d : []));
    fetch(`${API}/brands`).then(r => r.json()).then(d => setBrands(Array.isArray(d) ? d : []));
  }, []);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function createCategory(name: string, parentId?: string) {
    const res = await fetch(`${API}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ name, slug: autoSlug(name), parent: parentId || null })
    });
    if (!res.ok) { alert('Failed to create category'); return null; }
    const newCat = await res.json();
    setCats(prev => [...prev, newCat]);
    return newCat;
  }

  async function createBrand(name: string) {
    const res = await fetch(`${API}/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ name, slug: autoSlug(name) })
    });
    if (!res.ok) { alert('Failed to create brand'); return null; }
    const newBrand = await res.json();
    setBrands(prev => [...prev, newBrand]);
    return newBrand;
  }

  async function uploadFiles(files: FileList) {
    const arr = Array.from(files);
    setUploadingCount(c => c + arr.length);
    await Promise.all(arr.map(async file => {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API}/uploads?folder=products`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token()}` },
          body: fd,
        });
        const data = await res.json();
        if (data.url) {
          setForm((f: any) => ({ ...f, images: [...f.images, { url: data.url, alt: f.name }] }));
        }
      } finally {
        setUploadingCount(c => c - 1);
      }
    }));
    // reset so same files can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeImage(idx: number) {
    setForm((f: any) => ({ ...f, images: f.images.filter((_: any, i: number) => i !== idx) }));
  }

  async function openEdit(p: Product) {
    const full = await fetch(`${API}/products/${p._id}`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setForm({
      name: full.name || '', sku: full.sku || '', slug: full.slug || '',
      mrp: String(full.mrp || ''), sellingPrice: String(full.sellingPrice || ''),
      costPrice: String(full.costPrice || ''), gst: String(full.gst || '0'),
      stock: String(full.stock || '0'), minStock: String(full.minStock || '0'),
      category: full.category?._id || full.category || '',
      subCategory: full.subCategory?._id || full.subCategory || '',
      brand: full.brand?._id || full.brand || '',
      description: full.description || '', shortDescription: full.shortDescription || '',
      status: full.status || 'active',
      isFeatured: !!full.isFeatured, isNewArrival: !!full.isNewArrival,
      isBestSeller: !!full.isBestSeller, isTrending: !!full.isTrending,
      tags: (full.tags || []).join(', '),
      weight: String(full.weight || ''), warranty: full.warranty || '',
      returnPolicy: full.returnPolicy || '',
      metaTitle: full.metaTitle || '', metaDescription: full.metaDescription || '',
      images: full.images || [],
    });
    setEditing(p._id);
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    try {
      const url = editing ? `${API}/products/${editing}` : `${API}/products`;
      const body: any = {
        ...form,
        mrp: Number(form.mrp), sellingPrice: Number(form.sellingPrice),
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        gst: Number(form.gst), stock: Number(form.stock), minStock: Number(form.minStock),
        weight: form.weight ? Number(form.weight) : undefined,
        category: form.category || undefined, subCategory: form.subCategory || undefined, brand: form.brand || undefined,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      };
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { 
        const e = await res.json(); 
        if (e.details && Array.isArray(e.details)) {
          const msgs = e.details.map((d: any) => `• ${d.field}: ${d.message}`).join('\n');
          alert(`Please fix the following errors:\n\n${msgs}`);
        } else {
          alert(e.error || 'Failed to save product');
        }
        return; 
      }
      setForm(emptyForm); setEditing(null); setShowForm(false); load();
    } finally {
      setSaving(false);
    }
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
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ Add Product</button>
      </div>

      <input placeholder="Search products..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
        className="mb-4 border rounded-lg px-3 py-2 text-sm w-full max-w-sm" />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-lg">{editing ? 'Edit' : 'New'} Product</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* Images */}
              <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-2">Product Images</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {form.images.map((img: any, i: number) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-black/50 text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-xs gap-1">
                {uploadingCount > 0 ? <><span className="animate-spin text-lg">⟳</span><span>{uploadingCount} left</span></> : <><span className="text-2xl leading-none">+</span><span>Upload</span></>}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => e.target.files?.length && uploadFiles(e.target.files)} />
            <p className="text-xs text-gray-400">Or add image URL directly:</p>
            <div className="flex gap-2 mt-1">
              <input placeholder="https://..." className={inp + " flex-1"}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) { setForm((f: any) => ({ ...f, images: [...f.images, { url: val, alt: f.name }] })); (e.target as HTMLInputElement).value = ''; }
                  }
                }} />
              <span className="text-xs text-gray-400 self-center">Press Enter</span>
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Product Name *">
                <input className={inp} value={form.name}
                  onChange={e => setForm((f: any) => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))} />
              </F>
              <F label="Slug *">
                <input className={inp} value={form.slug} onChange={e => setForm((f: any) => ({ ...f, slug: e.target.value }))} />
              </F>
              <F label="SKU *">
                <input className={inp} value={form.sku} onChange={e => setForm((f: any) => ({ ...f, sku: e.target.value }))} />
              </F>
              <F label="Status">
                <select className={inp} value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </F>
              <F label="Category">
                <CreatableSelect 
                  options={cats.filter(c => !c.parent)} 
                  value={form.category} 
                  onChange={(val: string) => setForm((f: any) => ({ ...f, category: val, subCategory: '' }))} 
                  placeholder="Select or type..." 
                  onAdd={(name: string) => createCategory(name)} 
                />
              </F>
              <F label="Sub Category">
                <CreatableSelect 
                  options={cats.filter(c => c.parent === form.category || (c.parent as any)?._id === form.category)} 
                  value={form.subCategory} 
                  onChange={(val: string) => setForm((f: any) => ({ ...f, subCategory: val }))} 
                  placeholder="Select or type..." 
                  disabled={!form.category}
                  onAdd={(name: string) => createCategory(name, form.category)} 
                />
              </F>
              <F label="Brand">
                <CreatableSelect 
                  options={brands} 
                  value={form.brand} 
                  onChange={(val: string) => setForm((f: any) => ({ ...f, brand: val }))} 
                  placeholder="Select or type..." 
                  onAdd={(name: string) => createBrand(name)} 
                />
              </F>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Pricing & Inventory</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <F label="MRP (₹) *">
                <input type="number" className={inp} value={form.mrp} onChange={e => setForm((f: any) => ({ ...f, mrp: e.target.value }))} />
              </F>
              <F label="Selling Price (₹) *">
                <input type="number" className={inp} value={form.sellingPrice} onChange={e => setForm((f: any) => ({ ...f, sellingPrice: e.target.value }))} />
              </F>
              <F label="Cost Price (₹)">
                <input type="number" className={inp} value={form.costPrice} onChange={e => setForm((f: any) => ({ ...f, costPrice: e.target.value }))} />
              </F>
              <F label="GST (%)">
                <input type="number" className={inp} value={form.gst} onChange={e => setForm((f: any) => ({ ...f, gst: e.target.value }))} />
              </F>
              <F label="Stock">
                <input type="number" className={inp} value={form.stock} onChange={e => setForm((f: any) => ({ ...f, stock: e.target.value }))} />
              </F>
              <F label="Min Stock Alert">
                <input type="number" className={inp} value={form.minStock} onChange={e => setForm((f: any) => ({ ...f, minStock: e.target.value }))} />
              </F>
            </div>
          </div>

          {/* Details & Specs */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Details & Specs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Weight (grams)">
                <input type="number" className={inp} value={form.weight} onChange={e => setForm((f: any) => ({ ...f, weight: e.target.value }))} />
              </F>
              <F label="Tags (comma separated)">
                <input className={inp} value={form.tags} onChange={e => setForm((f: any) => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2, tag3" />
              </F>
              <F label="Warranty">
                <input className={inp} value={form.warranty} onChange={e => setForm((f: any) => ({ ...f, warranty: e.target.value }))} placeholder="e.g. 1 Year Manufacturer Warranty" />
              </F>
              <F label="Return Policy">
                <input className={inp} value={form.returnPolicy} onChange={e => setForm((f: any) => ({ ...f, returnPolicy: e.target.value }))} placeholder="e.g. 7-day easy returns" />
              </F>
              <div className="col-span-1 sm:col-span-2">
                <F label="Short Description">
                  <textarea className={inp} rows={2} value={form.shortDescription} onChange={e => setForm((f: any) => ({ ...f, shortDescription: e.target.value }))} />
                </F>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <F label="Description">
                  <textarea className={inp} rows={4} value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
                </F>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">SEO Meta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Meta Title">
                <input className={inp} value={form.metaTitle} onChange={e => setForm((f: any) => ({ ...f, metaTitle: e.target.value }))} />
              </F>
              <F label="Meta Description">
                <input className={inp} value={form.metaDescription} onChange={e => setForm((f: any) => ({ ...f, metaDescription: e.target.value }))} />
              </F>
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-5 mt-4">
            {([['isFeatured', 'Featured'], ['isNewArrival', 'New Arrival'], ['isBestSeller', 'Best Seller'], ['isTrending', 'Trending']] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" checked={form[k]} onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600" />
                {label}
              </label>
            ))}
          </div>

            </div>
            
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 shrink-0">
              <button onClick={save} disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Product'}
              </button>
              <button onClick={() => setShowForm(false)} className="border border-gray-300 bg-white px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 text-left">Image</th>
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
            <tbody className="divide-y whitespace-nowrap">
              {products.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {p.images?.[0]?.url
                    ? <img src={p.images[0].url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">📦</div>}
                </td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                <td className="px-4 py-3 text-gray-500">
                  {p.category?.name || '—'}
                  {p.subCategory?.name && <span className="text-gray-400 ml-1">/ {p.subCategory.name}</span>}
                </td>
                <td className="px-4 py-3">₹{p.mrp}</td>
                <td className="px-4 py-3 text-green-600 font-medium">₹{p.sellingPrice}</td>
                <td className="px-4 py-3">
                  <span className={p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-yellow-500' : 'text-gray-700'}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => openEdit(p)} className="text-indigo-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => del(p._id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
              {products.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No products yet</td></tr>}
            </tbody>
          </table>
        </div>
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

