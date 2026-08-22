'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    label: 'Orders',
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    links: [
      { href: '/dashboard/orders', label: 'All Orders' },
      { href: '/dashboard/orders?status=received', label: 'Received' },
      { href: '/dashboard/orders?status=accepted', label: 'Accepted' },
      { href: '/dashboard/orders?status=processing', label: 'Processing' },
      { href: '/dashboard/orders?status=packing', label: 'Assigned for packing' },
      { href: '/dashboard/orders?status=packed', label: 'Packed' },
      { href: '/dashboard/orders?status=assigned_delivery', label: 'Assigned for delivery' },
      { href: '/dashboard/orders?status=out_for_delivery', label: 'Out for Delivery' },
      { href: '/dashboard/orders?status=completed', label: 'Completed' },
      { href: '/dashboard/orders?status=cancelled', label: 'Cancelled' },
      { href: '/dashboard/orders?status=abandoned', label: 'Abandoned Cart' },
    ]
  },
  {
    label: 'Products',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    links: [
      { href: '/dashboard/tabs', label: 'Tabs' },
      { href: '/dashboard/categories', label: 'Category' },
      { href: '/dashboard/brands', label: 'Brand' },
      { href: '/dashboard/products', label: 'Products' },
      { href: '/dashboard/inventory', label: 'Inventory' },
      { href: '/dashboard/import', label: 'Bulk Import' },
    ]
  },
  {
    label: 'Customers',
    href: '/dashboard/customers',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    label: 'System & Content',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    links: [
      { href: '/dashboard/settings', label: 'Settings' },
      { href: '/dashboard/banners', label: 'Banners' },
      { href: '/dashboard/coupons', label: 'Coupons' },
      { href: '/dashboard/reviews', label: 'Reviews' },
      { href: '/dashboard/notifications', label: 'Notifications' },
      { href: '/dashboard/pages', label: 'CMS Pages' },
      { href: '/dashboard/reports', label: 'Reports' },
    ]
  }
];

function NavIcon({ d, className = "w-6 h-6" }: { d: string, className?: string }) {
  return (
    <svg className={`${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPathWithQuery = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  const isExactActive = useCallback((href: string) => {
    return href === currentPathWithQuery || (href === pathname && searchParams.toString() === '');
  }, [currentPathWithQuery, pathname, searchParams]);

  // Which primary menu is active (based on URL)
  const getActivePrimaryLabel = useCallback(() => {
    for (const item of menuItems) {
      if (item.href && isExactActive(item.href)) return item.label;
      if (item.links?.some(l => isExactActive(l.href))) return item.label;
    }
    return 'Dashboard';
  }, [isExactActive]);

  const activePrimary = getActivePrimaryLabel();

  // State for which primary item's sub-sidebar is currently open.
  // Defaults to the active one if it has links.
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  useEffect(() => {
    const activeItem = menuItems.find(i => i.label === activePrimary);
    if (activeItem?.links) {
      setOpenSubMenu(activePrimary);
    } else {
      setOpenSubMenu(null);
    }
  }, [activePrimary]);

  const handlePrimaryClick = (item: any) => {
    if (item.href) {
      setOpenSubMenu(null);
      if (onClose && !item.links) onClose();
    } else if (item.links && item.links.length > 0) {
      if (openSubMenu !== item.label) {
        setOpenSubMenu(item.label);
        router.push(item.links[0].href);
      } else {
        setOpenSubMenu(null);
      }
    }
  };

  const activeGroup = menuItems.find(i => i.label === openSubMenu);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <div className="flex h-full bg-[#0f172a] shadow-xl relative z-30">
      
      {/* Primary Sidebar (Icons only) */}
      <aside className="w-20 shrink-0 flex flex-col items-center py-5 h-full relative z-20 bg-[#0f172a]">
        
        {/* Logo */}
        <Link href="/dashboard" className="mb-8 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
          <span className="text-white font-extrabold text-lg">DB</span>
        </Link>

        {/* Primary Links */}
        <div className="flex-1 w-full flex flex-col items-center gap-4 px-2">
          {menuItems.map(item => {
            const isActive = activePrimary === item.label;
            return (
              <div key={item.label} className="w-full relative group">
                {item.href ? (
                  <Link href={item.href} onClick={() => handlePrimaryClick(item)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'}`}>
                    <NavIcon d={item.icon} />
                    <span className="text-[10px] font-semibold mt-1 tracking-wide">{item.label}</span>
                  </Link>
                ) : (
                  <button onClick={() => handlePrimaryClick(item)}
                    className={`w-full flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${isActive || openSubMenu === item.label ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'}`}>
                    <NavIcon d={item.icon} />
                    <span className="text-[10px] font-semibold mt-1 tracking-wide text-center leading-tight truncate w-full">{item.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Logout */}
        <div className="mt-auto px-2 w-full pt-4">
          <button onClick={logout}
            className="w-full flex flex-col items-center justify-center p-3 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </aside>

      {/* Secondary Sliding Sidebar */}
      <div 
        className={`bg-[#161e31] overflow-hidden transition-all duration-300 ease-in-out border-l border-white/[0.05] flex flex-col h-full ${openSubMenu ? 'w-56 opacity-100' : 'w-0 opacity-0 border-none'}`}
      >
        {activeGroup && (
          <>
            <div className="px-5 h-16 flex items-center justify-between border-b border-white/[0.05] shrink-0 sticky top-0 bg-[#161e31] z-10 w-56">
              <h2 className="text-white font-bold text-base tracking-wide">{activeGroup.label}</h2>
              <button onClick={() => setOpenSubMenu(null)} className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1 w-56">
              {activeGroup.links?.map(link => {
                const isActive = isExactActive(link.href);
                return (
                  <Link key={link.href} href={link.href} onClick={() => { if (window.innerWidth < 1024 && onClose) onClose(); }}
                    className={`block py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
