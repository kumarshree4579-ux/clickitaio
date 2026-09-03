'use client';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import API from '../lib/api';

export default function MobileTopbar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [tabs, setTabs] = useState<{ label: string; categorySlug: string; isActive: boolean }[]>([]);

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

  // Show on homepage and products page only
  if (pathname !== '/' && pathname !== '/products') return null;

  const currentCat = searchParams?.get('category') || '';
  const activeTabs = tabs?.filter(t => t.isActive) || [];
  if (activeTabs.length === 0) return null;

  return (
    <>
      {/* ── Mobile: full-width scroll row ── */}
      <div className="sm:hidden overflow-x-auto scrollbar-hide">
        <div className="flex px-3 gap-0 items-center w-max">
          {activeTabs.map((tab, i) => {
            const isActive = currentCat === tab.categorySlug;
            return (
              <Link
                key={i}
                href={tab.categorySlug ? `/products?category=${tab.categorySlug}` : '/products'}
                className={`relative px-3.5 py-2.5 text-[13px] font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Desktop: inline flex row within header ── */}
      <div className="hidden sm:flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-hide max-w-[320px] lg:max-w-none">
        {activeTabs.map((tab, i) => {
          const isActive = currentCat === tab.categorySlug;
          return (
            <Link
              key={i}
              href={tab.categorySlug ? `/products?category=${tab.categorySlug}` : '/products'}
              className={`relative px-3 py-1.5 text-[13px] font-bold whitespace-nowrap rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-primary bg-primary-light'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
