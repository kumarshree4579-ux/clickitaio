'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import API from '../../lib/api';
import ProductCard from '../../components/ProductCard';

function CategorySpySection({ category, onVisible }: { category: any, onVisible: (id: string) => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisible(category._id);
          if (!hasFetched && !loading) fetchProducts();
        }
      },
      { rootMargin: '-10% 0px -50% 0px' } // triggers when section is near top of viewport
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasFetched, loading, category._id, onVisible]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Fetch more products for this dedicated category view
      const res = await fetch(`${API}/products?limit=24&status=active&category=${category._id}`);
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

  return (
    <section ref={sectionRef} id={`category-${category._id}`} className="pt-2 pb-10">
      <h2 className="text-lg font-bold text-gray-800 mb-4 sticky top-0 bg-gray-50/90 backdrop-blur py-2 z-10 border-b border-gray-100">
        {category.name}
      </h2>

      {!hasFetched ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-slate-100 animate-pulse rounded-xl h-56 w-full"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} compact={true} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
           <span className="text-3xl text-gray-300">📦</span>
           <p className="text-gray-500 font-medium text-xs mt-2">No products found</p>
        </div>
      )}
    </section>
  );
}

export default function ScrollSpyLayout({ categories }: { categories: any[] }) {
  const [activeId, setActiveId] = useState<string>(categories[0]?._id || '');
  const rightPaneRef = useRef<HTMLDivElement>(null);
  
  const scrollToCategory = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(`category-${id}`);
    if (el && rightPaneRef.current) {
      const topOffset = el.offsetTop - rightPaneRef.current.offsetTop;
      rightPaneRef.current.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto bg-gray-50 flex flex-row min-h-[calc(100vh-140px)] sm:min-h-[calc(100vh-65px)]">
      
      {/* Left Sidebar - Categories */}
      <aside className="w-24 sm:w-1/4 lg:w-1/5 bg-white border-r border-gray-100 shrink-0 overflow-y-auto scrollbar-hide h-[calc(100vh-140px)] sm:h-[calc(100vh-65px)] sticky top-0">
        <div className="py-2">
          {categories.map((cat: any) => {
            const isActive = activeId === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => scrollToCategory(cat._id)}
                className={`w-full flex flex-col items-center justify-center p-2 sm:px-5 sm:py-4 text-xs sm:text-sm font-medium border-l-[3px] sm:border-l-4 transition-colors ${isActive
                  ? 'border-[var(--color-primary)] bg-primary-light/50 text-[var(--color-primary)]'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-100 mb-2 shrink-0 border border-gray-200 flex items-center justify-center">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm font-bold uppercase">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-center text-[10px] sm:text-sm font-medium leading-tight break-words w-full">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Pane - Products */}
      <div 
        ref={rightPaneRef} 
        className="flex-1 w-[calc(100%-6rem)] sm:w-3/4 lg:w-4/5 overflow-y-auto h-[calc(100vh-140px)] sm:h-[calc(100vh-65px)] scroll-smooth relative"
      >
        <div className="p-2 sm:p-6 pb-20 sm:pb-6 relative">
          {categories.map((cat) => (
            <CategorySpySection 
              key={cat._id} 
              category={cat} 
              onVisible={(id) => setActiveId(id)} 
            />
          ))}
          <div className="h-[50vh]"></div> {/* Spacer so the last category can scroll to top */}
        </div>
      </div>

    </div>
  );
}
