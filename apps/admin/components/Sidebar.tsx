'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/products', label: 'Products', icon: '📦' },
  { href: '/dashboard/categories', label: 'Categories', icon: '🗂️' },
  { href: '/dashboard/brands', label: 'Brands', icon: '🏷️' },
  { href: '/dashboard/orders', label: 'Orders', icon: '🛒' },
  { href: '/dashboard/inventory', label: 'Inventory', icon: '🏭' },
  { href: '/dashboard/coupons', label: 'Coupons', icon: '🎟️' },
  { href: '/dashboard/reviews', label: 'Reviews', icon: '⭐' },
  { href: '/dashboard/banners', label: 'Banners', icon: '🖼️' },
  { href: '/dashboard/pages', label: 'CMS Pages', icon: '📄' },
  { href: '/dashboard/import', label: 'Import', icon: '📊' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">Ecom Admin</div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(l => (
          <Link
            key={l.href} href={l.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === l.href ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="m-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg text-left">
        🚪 Logout
      </button>
    </aside>
  );
}
