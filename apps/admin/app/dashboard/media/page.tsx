'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../../lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_URL;

type Filter = 'all' | 'unlinked' | 'linked' | 'multi';

interface MediaItem {
  _id: string;
  originalName: string;
  url: string;
  public_id: string;
  size: number;
  linkCount: number;
  createdAt: string;
}

export default function MediaGalleryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [infoModal, setInfoModal] = useState<{ mediaId: string; products: any[] } | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const limit = 40;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), filter });
      if (search) params.set('q', search);
      const res = await apiFetch(`/media?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [page, filter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [filter, search]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i._id)));
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} image(s) from cloud storage? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiFetch('/uploads/media/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      load();
    } catch {}
    setDeleting(false);
  }

  async function showLinkedProducts(mediaId: string) {
    setInfoLoading(true);
    setInfoModal({ mediaId, products: [] });
    try {
      const res = await apiFetch(`/media/${mediaId}/products`);
      const products = await res.json();
      setInfoModal({ mediaId, products });
    } catch {
      setInfoModal({ mediaId, products: [] });
    }
    setInfoLoading(false);
  }

  const totalPages = Math.ceil(total / limit);
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unlinked', label: 'Unlinked' },
    { key: 'linked', label: 'Linked' },
    { key: 'multi', label: 'Multi-linked' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Media Gallery</h1>
          <p className="text-sm text-gray-500">{total} image{total !== 1 ? 's' : ''} in library</p>
        </div>
      </div>

      {/* Toolbar: search + filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Search by filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={selectAll} className="text-xs font-medium text-indigo-600 hover:underline">
              {selected.size === items.length ? 'Deselect all' : 'Select all on page'}
            </button>
            <span className="text-sm font-semibold text-indigo-700">{selected.size} selected</span>
          </div>
          <button
            onClick={bulkDelete}
            disabled={deleting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? 'Deleting...' : `Delete (${selected.size})`}
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <p className="text-3xl mb-3">🖼️</p>
          <p className="text-gray-500 font-medium">No media found</p>
          <p className="text-xs text-gray-400 mt-1">Upload images from the Import page</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map(item => {
            const isSelected = selected.has(item._id);
            return (
              <div
                key={item._id}
                className={`bg-white rounded-xl border overflow-hidden group relative transition-all ${
                  isSelected ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(item._id)}
                  className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Info button */}
                {item.linkCount > 0 && (
                  <button
                    onClick={() => showLinkedProducts(item._id)}
                    className="absolute top-2 right-2 z-10 w-5 h-5 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50"
                    title="View linked products"
                  >
                    i
                  </button>
                )}

                {/* Image */}
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.originalName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-[11px] font-medium text-gray-700 truncate" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.linkCount === 0
                        ? 'bg-gray-100 text-gray-500'
                        : item.linkCount > 1
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.linkCount === 0 ? 'Unlinked' : `${item.linkCount} product${item.linkCount > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Linked Products Modal */}
      {infoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setInfoModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Linked Products</h3>
              <button onClick={() => setInfoModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-5 max-h-80 overflow-y-auto">
              {infoLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : infoModal.products.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No linked products found</p>
              ) : (
                <div className="space-y-3">
                  {infoModal.products.map((p: any) => (
                    <div key={p._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {p.images?.[0]?.url
                          ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-[11px] text-gray-400">SKU: {p.sku}</p>
                      </div>
                      <a
                        href={`/dashboard/products`}
                        className="text-xs text-indigo-600 hover:underline font-medium shrink-0"
                      >
                        Edit
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
