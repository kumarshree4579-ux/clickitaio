import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto hidden sm:block">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo192.png" alt="Ecom" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-white font-bold text-lg">Ecom</span>
            </div>
            <p className="text-sm leading-relaxed">Your one-stop shop for quality products at great prices.</p>
            <div className="flex gap-3 mt-4">
              {['M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
                'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
              ].map((d, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d={d} /></svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-4">Shop</p>
            <div className="space-y-2.5">
              {[['All Products', '/products'], ['New Arrivals', '/products?newArrival=true'], ['Best Sellers', '/products?bestSeller=true'], ['Cart', '/cart']].map(([l, h]) => (
                <Link key={h} href={h} className="block text-sm hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-4">Account</p>
            <div className="space-y-2.5">
              {[['My Account', '/account'], ['My Orders', '/orders'], ['Wishlist', '/wishlist'], ['Addresses', '/account/addresses']].map(([l, h]) => (
                <Link key={h} href={h} className="block text-sm hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-4">Help</p>
            <div className="space-y-2.5">
              {[['About Us', '/pages/about'], ['Contact', '/pages/contact'], ['FAQ', '/pages/faq'], ['Refund Policy', '/pages/refund'], ['Privacy Policy', '/pages/privacy'], ['Terms', '/pages/terms']].map(([l, h]) => (
                <Link key={h} href={h} className="block text-sm hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} Ecom Store. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Secure Payments
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Verified Products
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
