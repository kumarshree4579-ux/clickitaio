'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import API from '../lib/api';


const fmt = (n: number) => n.toLocaleString('en-IN');

export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      const filtered = excludeId ? ids.filter(id => id !== excludeId) : ids;
      if (!filtered.length) return;
      // Fetch each product — batch via Promise.all, cap at 8
      Promise.all(
        filtered.slice(0, 8).map(id =>
          fetch(`${API}/products/${id}`).then(r => r.ok ? r.json() : null).catch(() => null)
        )
      ).then(results => setProducts(results.filter(Boolean)));
    } catch {}
  }, [excludeId]);

  if (!products.length) return null;

  return (
    <section className="mt-6 sm:mt-12">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-sm sm:text-lg font-bold text-gray-900">Recently Viewed</h2>
        <button onClick={() => { localStorage.removeItem('recently_viewed'); setProducts([]); }}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors">Clear</button>
      </div>
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        {products.map(p => {
          const discount = p.mrp > p.sellingPrice
            ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
          return (
            <Link key={p._id} href={`/products/${p._id}`}
              className="shrink-0 w-28 sm:w-36 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden group">
              <div className="relative w-full bg-gray-50 overflow-hidden" style={{ paddingBottom: '100%' }}>
                <div className="absolute inset-0">
                  {p.images?.[0]?.url
                    ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl text-gray-200">📦</div>}
                  {discount > 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{discount}%</span>
                  )}
                </div>
              </div>
              <div className="p-2 sm:p-2.5">
                <p className="text-[11px] sm:text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{p.name}</p>
                <p className="text-xs font-bold text-gray-900 mt-1">₹{fmt(p.sellingPrice)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
