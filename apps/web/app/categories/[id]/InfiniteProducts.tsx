'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../../../lib/api';
import ProductCard from '../../../components/ProductCard';

export default function InfiniteProducts({ categoryId, subCategoryId }: { categoryId: string, subCategoryId: string | null }) {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async (pageNum: number, isNew: boolean = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        limit: '12', 
        status: 'active', 
        page: pageNum.toString(),
      });
      if (subCategoryId) {
        params.set('subCategory', subCategoryId);
      } else if (categoryId) {
        params.set('category', categoryId);
      }

      const res = await fetch(`${API}/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      const items = data.items || [];
      
      if (isNew) {
        setProducts(items);
      } else {
        setProducts(prev => {
          // prevent duplicates if same page fetched twice
          const existingIds = new Set(prev.map(p => p._id));
          const newItems = items.filter((item: any) => !existingIds.has(item._id));
          return [...prev, ...newItems];
        });
      }
      
      setHasMore(items.length > 0 && items.length === 12);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [categoryId, subCategoryId]); // removed 'loading' to prevent issues

  // Reset when category or subcategory changes
  useEffect(() => {
    setInitialLoading(true);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  }, [categoryId, subCategoryId]);

  // Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !initialLoading) {
          setPage(p => p + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, initialLoading]);

  // Fetch when page changes (not 1)
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, false);
    }
  }, [page]);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
           <span className="text-3xl text-gray-300">📦</span>
        </div>
        <p className="text-gray-500 font-medium text-sm mb-5">No products found in this category.</p>
        <button 
          onClick={() => { setInitialLoading(true); fetchProducts(1, true); }}
          className="px-6 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
        >
          Reload Products
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 pb-4">
        {products.map(p => (
          <ProductCard key={p._id} product={p} compact={true} />
        ))}
      </div>
      
      <div ref={observerTarget} className="h-10 flex justify-center items-center py-4">
        {loading && hasMore && (
          <div className="animate-spin w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
        )}
        {!hasMore && products.length > 0 && (
          <span className="text-xs text-gray-400">You've reached the end</span>
        )}
      </div>
    </>
  );
}
