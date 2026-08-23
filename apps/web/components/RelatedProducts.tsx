'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import API from '../lib/api';
const fmt = (n: number) => n.toLocaleString('en-IN');

interface Props {
  categoryId: string;
  categoryName: string;
  excludeId: string;
}

export default function RelatedProducts({ categoryId, categoryName, excludeId }: Props) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/products?category=${categoryId}&status=active&limit=12`)
      .then(r => r.json())
      .then(d => setProducts((d.items || []).filter((p: any) => p._id !== excludeId)))
      .catch(() => {});
  }, [categoryId, excludeId]);

  if (!products.length) return null;

  return (
    <section className="mt-6 sm:mt-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-1 h-5 sm:h-6 bg-indigo-600 rounded-full" />
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-gray-900">More from {categoryName}</h2>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Similar products you might like</p>
          </div>
        </div>
        <Link href={`/products?category=${categoryId}`}
          className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 shrink-0">
          View all
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        {products.map(p => {
          const discount = p.mrp > p.sellingPrice
            ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
          return (
            <Link key={p._id} href={`/products/${p._id}`}
              className="shrink-0 w-32 sm:w-44 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
              <div className="relative w-full bg-gray-50 overflow-hidden" style={{ paddingBottom: '100%' }}>
                <div className="absolute inset-0">
                  {p.images?.[0]?.url
                    ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200">📦</div>}
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded-full border">Out of Stock</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-2.5 sm:p-3">
                {p.brand && <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-0.5 truncate">{p.brand.name}</p>}
                <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{p.name}</p>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-sm font-bold text-gray-900">₹{fmt(p.sellingPrice)}</span>
                  {discount > 0 && <span className="text-[10px] sm:text-xs text-gray-400 line-through">₹{fmt(p.mrp)}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
