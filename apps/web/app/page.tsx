import Link from 'next/link';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import HeroBanner from '../components/HeroBanner';
import RecentlyViewed from '../components/RecentlyViewed';

import API from '../lib/api';

async function getData() {
  try {
    const signal = AbortSignal.timeout(3000);
    const [featuredRes, newRes, bestRes, catsRes, settingsRes] = await Promise.all([
      fetch(`${API}/products?limit=8&status=active&featured=true`, { cache: 'no-store', signal }),
      fetch(`${API}/products?limit=8&status=active&newArrival=true`, { cache: 'no-store', signal }),
      fetch(`${API}/products?limit=4&status=active&bestSeller=true`, { cache: 'no-store', signal }),
      fetch(`${API}/categories`, { cache: 'no-store', signal }),
      fetch(`${API}/settings/public`, { next: { revalidate: 300 }, signal }),
    ]);
    const [featured, newArrivals, bestSellers, categories, settings] = await Promise.all([
      featuredRes.json(), newRes.json(), bestRes.json(), catsRes.json(), settingsRes.json(),
    ]);
    let featuredItems = featured.items || [];
    if (!featuredItems.length) {
      const fallback = await fetch(`${API}/products?limit=8&status=active`, { cache: 'no-store', signal }).then(r => r.json());
      featuredItems = fallback.items || [];
    }
    return {
      featured: featuredItems,
      newArrivals: newArrivals.items || [],
      bestSellers: bestSellers.items || [],
      categories: (categories || []).filter((c: any) => !c.parent).slice(0, 6),
      trustBadges: (settings.trustBadges || []).filter((b: any) => b.isActive),
    };
  } catch {
    return { featured: [], newArrivals: [], bestSellers: [], categories: [], trustBadges: [] };
  }
}

export default async function HomePage() {
  const { featured, newArrivals, bestSellers, categories, trustBadges } = await getData();

  const defaultBadges = [
    { icon: '🚚', title: 'Free Shipping', subtitle: 'On orders above ₹500' },
    { icon: '↩️', title: 'Easy Returns', subtitle: '7-day return policy' },
    { icon: '🔒', title: 'Secure Payment', subtitle: 'Razorpay & COD' },
    { icon: '⭐', title: 'Top Quality', subtitle: 'Verified products' },
  ];
  const badges = trustBadges.length ? trustBadges : defaultBadges;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Spacer: pushes content below the fixed header */}
      {/* Mobile: 56px logo + 50px search + ~40px tabs ≈ 146px */}
      {/* Desktop: 64px */}
      <div className="h-[146px] sm:h-16 shrink-0" />
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">

        {/* Hero Slider — managed from admin banners */}
        <section>
          <HeroBanner />
        </section>

        {/* Trust badges */}
        {badges.length > 0 && (
          <section className="bg-white border-b border-slate-100">
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                {badges.map((b: any) => (
                  <div key={b.title} className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2">
                    <span className="text-xl sm:text-2xl">{b.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{b.title}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">{b.subtitle || b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-14 max-w-7xl">

          {/* Categories */}
          {categories.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Shop by Category</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Browse our wide selection of categories</p>
                </div>
                <Link href="/products" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 shrink-0">
                  View all <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                {categories.map((c: any) => (
                  <Link key={c._id} href={`/products?category=${c._id}`}
                    className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                      ) : (
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-700 text-center leading-tight">{c.name}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recently Viewed — personalised, from localStorage */}
          <RecentlyViewed />

          {/* Best Sellers */}
          {bestSellers.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Best Sellers</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Our most popular products</p>
                </div>
                <Link href="/products?bestSeller=true" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 shrink-0">
                  View all <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                {bestSellers.map((p: any) => <ProductCard key={p._id} product={p} />)}
              </div>
            </section>
          )}

          {/* Featured Products */}
          {featured.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Featured Products</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Handpicked just for you</p>
                </div>
                <Link href="/products" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 shrink-0">
                  View all <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {featured.map((p: any) => <ProductCard key={p._id} product={p} />)}
              </div>
            </section>
          )}

          {/* New Arrivals */}
          {newArrivals.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">New Arrivals</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Fresh products just added</p>
                </div>
                <Link href="/products?newArrival=true" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 shrink-0">
                  View all <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {newArrivals.map((p: any) => <ProductCard key={p._id} product={p} />)}
              </div>
            </section>
          )}

          {featured.length === 0 && newArrivals.length === 0 && (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No products yet</h3>
              <p className="text-slate-500">Check back soon for amazing products!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
