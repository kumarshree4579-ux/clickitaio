'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    setUser(JSON.parse(u));
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  }

  if (!user) return null;

  const links = [
    { href: '/orders', icon: '📦', label: 'My Orders', sub: 'Track and manage orders' },
    { href: '/wishlist', icon: '❤️', label: 'Wishlist', sub: 'Your saved products' },
    { href: '/account/addresses', icon: '📍', label: 'Addresses', sub: 'Manage delivery addresses' },
  ];

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg">{user.name || 'Customer'}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <span className="text-2xl">{l.icon}</span>
              <div>
                <p className="font-medium text-gray-800">{l.label}</p>
                <p className="text-xs text-gray-500">{l.sub}</p>
              </div>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
          ))}
        </div>

        <button onClick={logout}
          className="w-full border border-red-200 text-red-600 py-3 rounded-xl hover:bg-red-50 transition-colors font-medium">
          Logout
        </button>
      </main>
    </>
  );
}
