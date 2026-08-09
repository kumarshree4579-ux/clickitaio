'use client';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import API from '../lib/api';

const fmt = (n: number) => n.toLocaleString('en-IN');

interface SuggestGroup {
  categoryName: string;
  items: { _id: string; name: string; image: string | null; sellingPrice: number; mrp: number }[];
}

export default function Header() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestGroup[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);       // user dropdown
  const [mobileMenu, setMobileMenu] = useState(false);   // mobile nav drawer
  const [searchOpen, setSearchOpen] = useState(false);   // mobile search bar
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

  // Focus mobile search input when it opens
  useEffect(() => {
    if (searchOpen) setTimeout(() => mobileSearchRef.current?.focus(), 50);
  }, [searchOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenu(false);
    setSearchOpen(false);
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setShowSuggest(false); return; }
    fetch(`${API}/products/suggest?q=${encodeURIComponent(q.trim())}`)
      .then(r => r.json())
      .then(d => { setSuggestions(Array.isArray(d) ? d : []); setShowSuggest(true); setActiveIdx(-1); })
      .catch(() => {});
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
    setSearchOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggest || !flatItems.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Escape') { setShowSuggest(false); setActiveIdx(-1); }
  }

  function selectItem(id: string) {
    router.push(`/products/${id}`);
    setShowSuggest(false);
    setSearch('');
    setSearchOpen(false);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    localStorage.removeItem('coupon');
    setUser(null);
    setMenuOpen(false);
    setMobileMenu(false);
    router.push('/');
  }

  const SuggestDropdown = () => {
    let runningIdx = 0;
    if (!showSuggest || (suggestions.length === 0 && search.trim().length < 2)) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[420px] overflow-y-auto">
        {suggestions.length > 0 ? (
          <>
            {suggestions.map(group => (
              <div key={group.categoryName}>
                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{group.categoryName}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                {group.items.map(item => {
                  const idx = runningIdx++;
                  const isActive = idx === activeIdx;
                  const discount = item.mrp > item.sellingPrice
                    ? Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100) : 0;
                  return (
                    <button key={item._id} type="button"
                      onClick={() => selectItem(item._id)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                      <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-base">📦</div>}
                      </div>
                      <p className="flex-1 text-sm text-gray-800 truncate">{item.name}</p>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">₹{fmt(item.sellingPrice)}</p>
                        {discount > 0 && <p className="text-[10px] text-rose-500 font-medium">{discount}% off</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button type="button"
                onClick={() => { router.push(`/products?q=${encodeURIComponent(search.trim())}`); setShowSuggest(false); setSearch(''); setSearchOpen(false); }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                See all results for "{search}"
              </button>
            </div>
          </>
        ) : (
          <div className="px-4 py-5 text-sm text-gray-400 text-center">No products found for "{search}"</div>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">

          {/* Main row */}
          <div className="flex items-center h-14 sm:h-16 gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-base sm:text-lg text-gray-900 tracking-tight">Ecom</span>
            </Link>

            {/* Desktop search */}
            <div className="hidden sm:flex flex-1 relative" ref={searchRef}>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                  )}
                </div>
              </form>
              <SuggestDropdown />
            </div>

            {/* Spacer on mobile */}
            <div className="flex-1 sm:hidden" />

            {/* Right actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">

              {/* Mobile search toggle */}
              <button onClick={() => setSearchOpen(o => !o)}
                className="sm:hidden p-2.5 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                {searchOpen
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              </button>

              {/* Wishlist — hidden on xs, visible sm+ */}
              <Link href="/wishlist" title="Wishlist"
                className="hidden sm:flex p-2.5 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* Cart */}
              <Link href="/cart" title="Cart"
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User — desktop dropdown */}
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(o => !o)}
                    className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[80px] truncate">
                      {user.name || user.email.split('@')[0]}
                    </span>
                    <svg className="w-3 h-3 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">{user.name || 'Customer'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {[
                        { href: '/account', label: 'My Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                        { href: '/orders', label: 'My Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                        { href: '/wishlist', label: 'Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={logout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login"
                  className="ml-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
                  Login
                </Link>
              )}

              {/* Mobile hamburger — only when logged in (for nav links) */}
              <button onClick={() => setMobileMenu(o => !o)}
                className="sm:hidden p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors ml-0.5">
                {mobileMenu
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
              </button>
            </div>
          </div>

          {/* Mobile search bar — slides in below main row */}
          {searchOpen && (
            <div className="sm:hidden pb-3 relative" ref={searchRef}>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={mobileSearchRef}
                    value={search} onChange={handleChange} onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
                    placeholder="Search products, brands..."
                    autoComplete="off"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  {search && (
                    <button type="button" onClick={() => { setSearch(''); setSuggestions([]); setShowSuggest(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                  )}
                </div>
              </form>
              <SuggestDropdown />
            </div>
          )}
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileMenu && (
        <div className="sm:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenu(false)} />
          <div className="absolute top-14 left-0 right-0 bg-white shadow-xl border-b border-gray-100 z-50">
            {user && (
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-indigo-50">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name || 'Customer'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}
            <nav className="py-2">
              {[
                { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { href: '/products', label: 'Products', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                { href: '/wishlist', label: 'Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                ...(user ? [
                  { href: '/orders', label: 'My Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                  { href: '/account', label: 'My Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                ] : []),
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 border-t border-gray-100">
              {user ? (
                <button onClick={logout}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-medium py-3 rounded-2xl text-sm hover:bg-red-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileMenu(false)}
                  className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-3 rounded-2xl text-sm hover:bg-indigo-700 transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
