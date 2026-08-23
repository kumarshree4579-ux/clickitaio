'use client';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import API from '../lib/api';
import MobileTopbar from './MobileTopbar';
import { useLocation } from '../lib/LocationContext';

interface SuggestGroup {
  categoryName: string;
  items: { _id: string; name: string; image: string | null; sellingPrice: number; mrp: number }[];
}

export default function Header() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [search, setSearch] = useState('');
  const { addressString, isServiceable, serviceabilityMessage, openPrompt } = useLocation();
  const [suggestions, setSuggestions] = useState<SuggestGroup[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatItems = suggestions.flatMap(g => g.items);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((s: number, i: any) => s + i.qty, 0));
    };
    updateCart();
    window.addEventListener('cart-updated', updateCart);
    return () => window.removeEventListener('cart-updated', updateCart);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggest(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Lock body scroll when search suggestions are open on mobile
  useEffect(() => {
    if (showSuggest && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showSuggest]);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setShowSuggest(false); setSearching(false); return; }
    setSearching(true);
    setShowSuggest(true);
    fetch(`${API}/products/suggest?q=${encodeURIComponent(q.trim())}`)
      .then(r => r.json())
      .then(d => { setSuggestions(Array.isArray(d) ? d : []); setActiveIdx(-1); })
      .catch(() => { })
      .finally(() => setSearching(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 220);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (activeIdx >= 0 && flatItems[activeIdx]) {
      router.push(`/products/${flatItems[activeIdx]._id}`);
    } else if (search.trim()) {
      router.push(`/products?q=${encodeURIComponent(search.trim())}`);
    }
    setShowSuggest(false);
    setSearch('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggest || flatItems.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Escape') { setShowSuggest(false); setActiveIdx(-1); }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  }

  const SuggestDropdown = () => {
    if (!showSuggest) return null;

    // Skeleton while searching
    if (searching) {
      return (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] p-3 space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 bg-gray-100 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-50 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    // No results
    if (suggestions.length === 0 && search.trim().length >= 2) {
      return (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] p-6 text-center">
          <p className="text-sm text-gray-400">No products found for &ldquo;{search}&rdquo;</p>
        </div>
      );
    }

    if (suggestions.length === 0) return null;

    return (
      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] max-h-80 overflow-y-auto overscroll-contain">
        {suggestions.map((group, gi) => (
          <div key={gi}>
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">{group.categoryName}</p>
            </div>
            {group.items.map((item, ii) => {
              const globalIdx = suggestions.slice(0, gi).reduce((s, g) => s + g.items.length, 0) + ii;
              const isActive = globalIdx === activeIdx;
              return (
                <button key={item._id}
                  onMouseDown={() => { router.push(`/products/${item._id}`); setShowSuggest(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors text-left ${isActive ? 'bg-indigo-50' : ''}`}>
                  <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-gray-300 text-lg">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-indigo-600 font-bold">₹{item.sellingPrice.toLocaleString('en-IN')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP — Fixed at top, full-width bar
          ═══════════════════════════════════════════ */}
      <header className="hidden sm:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="w-full px-6 lg:px-8 max-w-[1400px] mx-auto">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <img src="/logo192.png" alt="Daily Basket" className="w-9 h-9 rounded-xl object-contain" />
              <span className="text-lg font-extrabold tracking-tight">
                <span className="text-indigo-600">Daily</span>
                <span className="text-gray-900"> Basket</span>
              </span>
            </Link>

            {/* Location Pill */}
            <div className="shrink-0 border-l border-gray-200 pl-4">
              <button onClick={openPrompt} className="flex flex-col items-start hover:opacity-80 transition-opacity">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Delivering to</span>
                <div className="flex items-center gap-1 text-sm font-bold text-gray-900 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate max-w-[180px]">{addressString || 'Select Location'}</span>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isServiceable === false && (
                  <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold mt-0.5">{serviceabilityMessage || 'Unserviceable'}</span>
                )}
              </button>
            </div>

            {/* Category Tabs — desktop inline */}
            <Suspense fallback={null}>
              <MobileTopbar />
            </Suspense>

            {/* Search Bar */}
            <div className="flex flex-1 relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={search} onChange={handleChange} onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
                    placeholder="Search products, brands..."
                    autoComplete="off"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  {search && (
                    <button type="button" onClick={() => { setSearch(''); setSuggestions([]); setShowSuggest(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
                  )}
                </div>
              </form>
              <SuggestDropdown />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Link href="/support" title="Support" className="p-2.5 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </Link>
              <Link href="/wishlist" title="Wishlist" className="p-2.5 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </Link>
              <Link href="/cart" title="Cart" className="relative p-2.5 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cartCount > 9 ? '9+' : cartCount}</span>
                )}
              </Link>

              {user ? (
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 max-w-[90px] truncate hidden md:block">{user.name || user.email.split('@')[0]}</span>
                    <svg className="w-3 h-3 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{user.name || 'Customer'}</p>
                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      </div>
                      {[
                        { href: '/account', label: 'My Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                        { href: '/orders', label: 'My Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                        { href: '/wishlist', label: 'Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="ml-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm whitespace-nowrap">Login</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          MOBILE — Fixed at top, two-row layout
          Row 1: Logo + Location (h-14 = 56px)
          Row 2: Search Bar + Tabs (h ~= 90px)
          Total fixed height ≈ 146px
          ═══════════════════════════════════════════ */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 24px)' }}>
        {/* Row 1 — Logo + Location */}
        <div className="border-b border-gray-100 px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <img src="/logo192.png" alt="Daily Basket" className="w-10 h-10 rounded-xl object-contain" />
              <span className="text-[17px] font-extrabold tracking-tight">
                <span className="text-indigo-600">Daily</span>
                <span className="text-gray-900"> Basket</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Location */}
              <button onClick={openPrompt} className="flex flex-col items-end hover:opacity-80 transition-opacity">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Deliver to</span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[13px] font-bold text-gray-900 max-w-[100px] truncate">{addressString || 'Select'}</span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </div>
                {isServiceable === false && (
                  <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold mt-0.5">{serviceabilityMessage || 'Not serviceable'}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 — Search + Tabs */}
        <div className="border-b border-gray-100 bg-white">
          <div className="px-3 pt-2 pb-1.5 relative" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={mobileSearchRef}
                  value={search} onChange={handleChange} onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
                  placeholder="Search for products..."
                  autoComplete="off"
                  className="w-full bg-gray-100 border-0 rounded-xl pl-10 pr-10 py-2.5 text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
                />
                {search ? (
                  <button type="button" onClick={() => { setSearch(''); setSuggestions([]); setShowSuggest(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl leading-none">&times;</button>
                ) : (
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                )}
              </div>
            </form>
            <SuggestDropdown />
          </div>
          <Suspense fallback={<div className="h-9 bg-white" />}>
            <MobileTopbar />
          </Suspense>
        </div>
      </div>
    </>
  );
}
