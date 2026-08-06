'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((s: number, i: any) => s + i.qty, 0));
    window.addEventListener('cart-updated', () => {
      const c = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(c.reduce((s: number, i: any) => s + i.qty, 0));
    });
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-bold text-blue-600">Ecom</Link>

        <form action="/products" className="flex-1 max-w-md">
          <input name="q" placeholder="Search products..." className="w-full border rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </form>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/wishlist" className="text-gray-700 hover:text-red-500" title="Wishlist">🤍</Link>
          <Link href="/cart" className="relative flex items-center gap-1 text-gray-700 hover:text-blue-600">
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </Link>
          {user ? (
            <Link href="/account" className="text-gray-700 hover:text-blue-600">👤 {user.name || user.email.split('@')[0]}</Link>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
