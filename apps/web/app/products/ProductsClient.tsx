'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  sp: any;
  topCats: any[];
  brands: any[];
  total: number;
  page: number;
  activeFilters: { label: string; key: string }[];
  children: React.ReactNode;
}

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function ProductsClient({ sp, topCats, brands, total, page, activeFilters, children }: Props) {
  function buildUrl(extra: Record<string, string>) {
    const p = new URLSearchParams();
    if (sp.q) p.set('q', sp.q);
    if (sp.category) p.set('category', sp.category);
    if (sp.brand) p.set('brand', sp.brand);
    if (sp.sort) p.set('sort', sp.sort);
    Object.entries(extra).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    return `/products?${p.toString()}`;
  }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  function removeFilter(key: string) {
    const p = new URLSearchParams();
    if (sp.q) p.set('q', sp.q);
    if (sp.sort) p.set('sort', sp.sort);
    if (key !== 'category' && sp.category) p.set('category', sp.category);
    if (key !== 'brand' && sp.brand) p.set('brand', sp.brand);
    if (key !== 'newArrival' && sp.newArrival) p.set('newArrival', sp.newArrival);
    if (key !== 'bestSeller' && sp.bestSeller) p.set('bestSeller', sp.bestSeller);
    if (key !== 'featured' && sp.featured) p.set('featured', sp.featured);
    router.push(`/products?${p.toString()}`);
  }

  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Categories</p>
        <div className="space-y-0.5">
          <Link href="/products" onClick={() => setDrawerOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${!sp.category ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px]">🛍</span>
            All Products
          </Link>
          {topCats.map((c: any) => (
            <Link key={c._id} href={buildUrl({ category: c._id, page: '1' })} onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${sp.category === c._id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              {c.image
                ? <img src={c.image} alt={c.name} className="w-5 h-5 rounded object-cover shrink-0" />
                : <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] shrink-0">📦</span>}
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Brands</p>
          <div className="space-y-0.5">
            {brands.map((b: any) => (
              <Link key={b._id} href={buildUrl({ brand: b._id, page: '1' })} onClick={() => setDrawerOpen(false)}
                className={`flex items-center px-3 py-2 rounded-xl text-sm transition-colors ${sp.brand === b._id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                {b.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick filters */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Filter By</p>
        <div className="space-y-0.5">
          {[
            { label: '🆕 New Arrivals', key: 'newArrival', val: 'true' },
            { label: '🔥 Best Sellers', key: 'bestSeller', val: 'true' },
            { label: '⭐ Featured', key: 'featured', val: 'true' },
          ].map(f => (
            <Link key={f.key} href={buildUrl({ [f.key]: sp[f.key] ? '' : f.val, page: '1' })} onClick={() => setDrawerOpen(false)}
              className={`flex items-center px-3 py-2 rounded-xl text-sm transition-colors ${sp[f.key] ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              {f.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Top bar: title + mobile filter btn + sort */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 truncate">
            {sp.q ? `"${sp.q}"` : sp.category ? topCats.find(c => c._id === sp.category)?.name || 'Products' : 'All Products'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{total} product{total !== 1 ? 's' : ''}</p>
        </div>

        {/* Sort dropdown */}
        <select
          value={sp.sort || ''}
          onChange={e => router.push(buildUrl({ sort: e.target.value, page: '1' }))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shrink-0">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Mobile filter button */}
        <button onClick={() => setDrawerOpen(true)}
          className="md:hidden flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
          {activeFilters.length > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{activeFilters.length}</span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <button key={f.key} onClick={() => removeFilter(f.key)}
              className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
              {f.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          ))}
          <Link href="/products" className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 transition-colors">
            Clear all
          </Link>
        </div>
      )}

      <div className="flex gap-5">
        {/* Desktop sidebar */}
        <aside className="w-44 lg:w-52 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24">
            <SidebarContent />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Prev
                </Link>
              )}
              {Array.from({ length: Math.min(5, Math.ceil(total / 20)) }, (_, i) => {
                const pg = Math.max(1, page - 2) + i;
                if (pg > Math.ceil(total / 20)) return null;
                return (
                  <Link key={pg} href={buildUrl({ page: String(pg) })}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${pg === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                    {pg}
                  </Link>
                );
              })}
              {page * 20 < total && (
                <Link href={buildUrl({ page: String(page + 1) })}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="px-5 py-5">
              <SidebarContent />
            </div>
            <div className="px-5 pb-8 pt-2 border-t border-gray-100">
              <button onClick={() => setDrawerOpen(false)}
                className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-indigo-700">
                Show {total} Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
