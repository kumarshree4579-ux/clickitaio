import Link from 'next/link';

const links = [
  { href: '/pages/about', label: 'About Us' },
  { href: '/pages/contact', label: 'Contact' },
  { href: '/pages/privacy', label: 'Privacy Policy' },
  { href: '/pages/terms', label: 'Terms & Conditions' },
  { href: '/pages/refund', label: 'Refund Policy' },
  { href: '/pages/shipping', label: 'Shipping Policy' },
  { href: '/pages/faq', label: 'FAQ' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-white font-bold text-lg mb-2">Ecom Store</p>
            <p className="text-sm">Your one-stop shop for everything you need.</p>
          </div>
          <div>
            <p className="text-white font-medium mb-3 text-sm">Quick Links</p>
            <div className="space-y-1">
              <Link href="/products" className="block text-sm hover:text-white transition-colors">All Products</Link>
              <Link href="/cart" className="block text-sm hover:text-white transition-colors">Cart</Link>
              <Link href="/orders" className="block text-sm hover:text-white transition-colors">My Orders</Link>
              <Link href="/account" className="block text-sm hover:text-white transition-colors">My Account</Link>
            </div>
          </div>
          <div>
            <p className="text-white font-medium mb-3 text-sm">Help</p>
            <div className="space-y-1">
              {links.slice(1, 5).map(l => (
                <Link key={l.href} href={l.href} className="block text-sm hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white font-medium mb-3 text-sm">Policies</p>
            <div className="space-y-1">
              {links.slice(4).map(l => (
                <Link key={l.href} href={l.href} className="block text-sm hover:text-white transition-colors">{l.label}</Link>
              ))}
              <Link href="/pages/privacy" className="block text-sm hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-xs">
          © {new Date().getFullYear()} Ecom Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
