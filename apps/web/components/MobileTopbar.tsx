'use client';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import API from '../lib/api';

export default function MobileTopbar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [tabs, setTabs] = useState<{ label: string, categorySlug: string, isActive: boolean }[]>([]);

  useEffect(() => {
    fetch(`${API}/settings/public`)
      .then(res => {
        if (!res.ok) throw new Error('API down');
        return res.json();
      })
      .then(data => {
        if (data?.topbarTabs) setTabs(data.topbarTabs);
      })
      .catch(err => console.error('Failed to load topbar tabs:', err));
  }, []);
  
  // Only show on the homepage or products page, adjust as needed
  if (pathname !== '/' && pathname !== '/products') return null;

  const currentCat = searchParams?.get('category') || '';

  const activeTabs = tabs?.filter(t => t.isActive) || [];
  if (activeTabs.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-[96px] sm:top-[64px] z-30 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex px-3 sm:px-8 gap-1 sm:gap-6 items-center w-max mx-auto sm:mx-0">
        {activeTabs.map((tab, i) => {
          const isActive = currentCat === tab.categorySlug;
          return (
            <Link
              key={i}
              href={tab.categorySlug ? `/products?category=${tab.categorySlug}` : '/products'}
              className={`relative px-3 sm:px-2 py-2.5 sm:py-3.5 text-[13px] sm:text-[15px] font-bold whitespace-nowrap transition-all duration-200 ${
                isActive 
                  ? 'text-[var(--color-primary,#4f46e5)]' 
                  : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-1 right-1 h-[2.5px] bg-[var(--color-primary,#4f46e5)] rounded-full transition-all duration-300" />
              )}
            </Link>
          );
        })}
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
