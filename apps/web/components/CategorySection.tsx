'use client';

import { useState, useEffect, useRef } from 'react';
import API from '../lib/api';
import ProductCard from './ProductCard';
import Link from 'next/link';

export default function CategorySection({ category }: { category: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasFetched && !loading) {
          fetchProducts();
        }
      },
      { rootMargin: '200px' } // fetch a bit before it enters viewport
    );

    if (targetRef.current) observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [hasFetched, loading]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/products?limit=8&status=active&category=${category._id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHasFetched(true);
      setLoading(false);
    }
  };

  // If fetched and no products, don't render the section
  if (hasFetched && products.length === 0) return null;

  return (
    <section ref={targetRef} className="pt-2 pb-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          {category.image && (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
              <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">{category.name}</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Explore {category.name} items</p>
          </div>
        </div>
        <Link href={`/categories?active=${category._id}`} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 shrink-0 bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
          View all <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>

      {!hasFetched ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-slate-100 animate-pulse rounded-xl h-64 w-full"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
