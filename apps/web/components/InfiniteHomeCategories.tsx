'use client';

import { useState, useEffect, useRef } from 'react';
import CategorySection from './CategorySection';

export default function InfiniteHomeCategories({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(true); // Assuming there's more if we got some initially
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If the initial fetch returned fewer than 3, we probably don't have more.
    if (initialCategories.length < 3) {
      setHasMore(false);
    }
  }, [initialCategories]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMoreCategories();
        }
      },
      { rootMargin: '300px' }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page]);

  const fetchMoreCategories = async () => {
    setLoading(true);
    try {
      // In production, we'd use an absolute URL or proxy. Since this is client-side, 
      // we can use a relative URL if we have an API route proxy, or NEXT_PUBLIC_API_URL.
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API_URL}/categories?limit=3&page=${page}&parent=null`);
      if (res.ok) {
        const newCats = await res.json();
        if (newCats.length > 0) {
          setCategories(prev => [...prev, ...newCats]);
          setPage(p => p + 1);
        } else {
          setHasMore(false);
        }
        if (newCats.length < 3) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch more categories:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 border-t border-slate-100 mt-8 space-y-2 relative">
      {categories.map((c: any) => (
        <CategorySection key={c._id} category={c} />
      ))}
      
      {/* Infinite Scroll trigger */}
      {hasMore && (
        <div ref={loaderRef} className="h-20 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
