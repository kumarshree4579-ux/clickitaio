'use client';
import React, { useEffect, useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import API from '../../../lib/api';
import { exportToCSV } from '../../../lib/exportCsv';

const token = () => localStorage.getItem('token');

interface Category { _id: string; name: string; slug: string; parent?: { _id: string; name: string } | null; isActive: boolean; image?: string; isFallbackImage?: boolean; description?: string; }

// Helper function to extract cropped blob using Canvas
async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  const pixelRatio = window.devicePixelRatio;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      0.95
    );
  });
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', parent: '', description: '', image: '', isActive: true });
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // New UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isExpandAll, setIsExpandAll] = useState(false);

  // Crop States
  const [cropSrc, setCropSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [isCroppingUrl, setIsCroppingUrl] = useState(false);

  async function load() {
    const data = await fetch(`${API}/categories`).then(r => r.json());
    setCats(data);
  }

  useEffect(() => { load(); }, []);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropSrc(reader.result?.toString() || '');
        setIsCroppingUrl(false);
        setShowCropModal(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (Math.min(width, height) / width) * 100;
    
    const defaultCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: cropWidthInPercent }, 1, width, height),
      width,
      height
    );
    setCrop(defaultCrop);
  }

  async function handleCropApply() {
    if (!imgRef.current || !completedCrop) return;
    try {
      setUploading(true);
      setShowCropModal(false);
      const blob = await getCroppedImg(imgRef.current, completedCrop);
      await uploadBlob(blob, isCroppingUrl ? 'cropped_url_image.webp' : 'cropped_image.webp');
    } catch (e) {
      alert('Failed to crop image. ' + (e as Error).message);
    } finally {
      setUploading(false);
      setCropSrc('');
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function uploadBlob(blob: Blob, filename: string) {
    try {
      const formData = new FormData();
      formData.append('file', blob, filename);
      const res = await fetch(`${API}/uploads?folder=categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) setForm(f => ({ ...f, image: data.url }));
      else alert(data.error);
    } catch (e) {
      alert('Upload failed: ' + (e as Error).message);
    }
  }

  async function save() {
    const url = editing ? `${API}/categories/${editing}` : `${API}/categories`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...form, parent: form.parent || null }),
    });
    if (!res.ok) { const e = await res.json(); alert(e.error || JSON.stringify(e.details)); return; }
    setForm({ name: '', slug: '', parent: '', description: '', image: '', isActive: true });
    setEditing(null); setShowForm(false); load();
  }

  async function del(id: string) {
    if (!confirm('Delete?')) return;
    await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  function edit(c: Category) {
    setForm({ 
      name: c.name, 
      slug: c.slug, 
      parent: (c.parent as any)?._id || '', 
      description: c.description || '', 
      image: c.isFallbackImage ? '' : (c.image || ''), 
      isActive: c.isActive 
    });
    setEditing(c._id); setShowForm(true);
  }

  // --- Tree & Search Logic ---
  const query = searchQuery.toLowerCase();
  
  const matches = new Set<string>();
  cats.forEach(c => {
    if (c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query)) {
      matches.add(c._id);
      if (c.parent && (c.parent as any)._id) {
        matches.add((c.parent as any)._id);
      }
    }
  });

  const filteredCats = searchQuery ? cats.filter(c => matches.has(c._id)) : cats;
  const topLevel = filteredCats.filter(c => !c.parent);
  const getChildren = (parentId: string) => filteredCats.filter(c => c.parent && (c.parent as any)._id === parentId);

  useEffect(() => {
    if (searchQuery) {
      const parentsWithMatchingChildren = new Set<string>();
      cats.forEach(c => {
        if ((c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query)) && c.parent) {
          parentsWithMatchingChildren.add((c.parent as any)._id);
        }
      });
      setExpandedIds(parentsWithMatchingChildren);
      setIsExpandAll(false);
    }
  }, [searchQuery, cats, query]);

  function toggleExpand(id: string) {
    if (isExpandAll) {
      setIsExpandAll(false);
      const newSet = new Set(topLevel.map(c => c._id));
      newSet.delete(id);
      setExpandedIds(newSet);
    } else {
      setExpandedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.clear();
          next.add(id);
        }
        return next;
      });
    }
  }

  function toggleExpandAll() {
    if (isExpandAll) {
      setIsExpandAll(false);
      setExpandedIds(new Set());
    } else {
      setIsExpandAll(true);
      setExpandedIds(new Set(topLevel.map(c => c._id)));
    }
  }

  const renderRow = (c: Category, depth: number = 0) => {
    const children = getChildren(c._id);
    const hasChildren = children.length > 0;
    const isExpanded = isExpandAll || expandedIds.has(c._id);

    return (
      <React.Fragment key={c._id}>
        <tr className={`hover:bg-gray-50 border-b border-gray-100 ${depth > 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3" style={{ paddingLeft: `${depth * 2.5}rem` }}>
              {depth === 0 ? (
                <button 
                  onClick={() => hasChildren && toggleExpand(c._id)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${hasChildren ? 'text-gray-500 hover:bg-gray-200' : 'text-transparent cursor-default'}`}
                >
                  <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ) : (
                <div className="w-7 h-7 flex items-center justify-center text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              )}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 shadow-sm">
                {c.image
                  ? <img src={c.image} alt={c.name} className={`w-full h-full object-cover ${c.isFallbackImage ? 'opacity-50' : ''}`} />
                  : <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                }
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-sm">{c.name} {hasChildren && <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{children.length} sub</span>}</span>
                <span className="text-xs text-gray-500 font-mono mt-0.5">{c.slug}</span>
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {c.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-4">
              <button onClick={() => edit(c)} className="text-indigo-600 hover:text-indigo-900 text-sm font-bold transition-colors">Edit</button>
              <button onClick={() => del(c._id)} className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors">Delete</button>
            </div>
          </td>
        </tr>
        {isExpanded && children.map(child => renderRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => exportToCSV('categories_export', cats)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          <button onClick={toggleExpandAll} className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white shadow-sm transition-all">
            {isExpandAll ? 'Collapse All' : 'Expand All'}
          </button>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', slug: '', parent: '', description: '', image: '', isActive: true }); }}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
            + Add Category
          </button>
        </div>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
           <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input 
          type="text" 
          placeholder="Search categories by name or slug..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-gray-800 placeholder-gray-400 transition-shadow"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg overflow-y-auto max-h-[90vh] border border-gray-100">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">{editing ? 'Edit' : 'New'} Category</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Name</label>
                <input placeholder="e.g. Living Room" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : autoSlug(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Slug</label>
                <input placeholder="living-room" value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Parent Category</label>
                <select value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                  <option value="">None (Top Level)</option>
                  {cats.filter(c => !c.parent && c._id !== editing).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Description (optional)</label>
                <textarea placeholder="Category description..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-20" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Category Image (optional)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                    {form.image ? (
                      <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={onSelectFile} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2">
                      {uploading ? (
                        <><svg className="animate-spin w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Uploading...</>
                      ) : (
                        <><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Upload & Crop Image</>
                      )}
                    </button>
                    <p className="text-[11px] text-gray-500 mt-2 font-medium">Leave empty to auto-use first product image</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <input placeholder="Or enter Image URL" value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  {form.image && (
                    <button 
                      onClick={() => {
                        setCropSrc(form.image);
                        setIsCroppingUrl(true);
                        setShowCropModal(true);
                      }}
                      className="shrink-0 bg-indigo-50 text-indigo-700 px-3 py-2.5 rounded-xl text-sm font-bold border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      Crop URL
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">Category is active on Storefront</label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={save} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
                Save Category
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal Overlay */}
      {showCropModal && cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">Crop Category Image</h2>
            <p className="text-sm text-gray-500 mb-4">Drag to move and resize the square box to frame your icon perfectly.</p>
            
            <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 p-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop={true}
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={cropSrc}
                  onLoad={onImageLoad}
                  crossOrigin={isCroppingUrl ? 'anonymous' : undefined}
                  className="max-w-full max-h-[50vh] object-contain"
                  onError={(e) => {
                    if (isCroppingUrl) {
                      alert('This external URL blocks image cropping due to CORS. Please save the image and upload it manually instead.');
                      setShowCropModal(false);
                      setCropSrc('');
                    }
                  }}
                />
              </ReactCrop>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleCropApply} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Apply Crop
              </button>
              <button 
                onClick={() => {
                  setShowCropModal(false);
                  setCropSrc('');
                  if (fileRef.current) fileRef.current.value = '';
                }} 
                className="flex-1 bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table List */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-11 py-4 text-left font-bold text-xs uppercase tracking-wider">Category</th>
              <th className="px-4 py-4 text-left font-bold text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-4 text-right font-bold text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topLevel.map(c => renderRow(c, 0))}
            {topLevel.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    <span className="text-gray-500 font-medium">No categories found matching your search.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

