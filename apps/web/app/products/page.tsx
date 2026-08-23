import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import ProductsClient from './ProductsClient';
import Link from 'next/link';

import API from '../../lib/api';

async function getData(sp: any) {
  const params = new URLSearchParams({ limit: '20', status: 'active', page: sp.page || '1' });
  if (sp.q) params.set('q', sp.q);
  if (sp.category) params.set('category', sp.category);
  if (sp.brand) params.set('brand', sp.brand);
  if (sp.newArrival) params.set('newArrival', sp.newArrival);
  if (sp.bestSeller) params.set('bestSeller', sp.bestSeller);
  if (sp.featured) params.set('featured', sp.featured);
  if (sp.sort === 'price_asc') params.set('sort', 'price_asc');
  if (sp.sort === 'price_desc') params.set('sort', 'price_desc');
  if (sp.sort === 'newest') params.set('sort', 'newest');
  try {
    const [prodRes, catsRes, brandsRes] = await Promise.all([
      fetch(`${API}/products?${params}`, { cache: 'no-store' }),
      fetch(`${API}/categories`, { cache: 'no-store' }),
      fetch(`${API}/brands`, { cache: 'no-store' }),
    ]);
    const [data, categories, brands] = await Promise.all([prodRes.json(), catsRes.json(), brandsRes.json()]);
    return { products: data.items || [], total: data.total || 0, categories, brands };
  } catch {
    return { products: [], total: 0, categories: [], brands: [] };
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const { products, total, categories, brands } = await getData(sp);
  const page = parseInt(sp.page || '1');
  const topCats = (categories as any[]).filter(c => !c.parent);

  const activeFilters = [
    sp.category && { label: topCats.find((c: any) => c._id === sp.category)?.name || 'Category', key: 'category' },
    sp.brand && { label: (brands as any[]).find((b: any) => b._id === sp.brand)?.name || 'Brand', key: 'brand' },
    sp.newArrival && { label: 'New Arrivals', key: 'newArrival' },
    sp.bestSeller && { label: 'Best Sellers', key: 'bestSeller' },
    sp.featured && { label: 'Featured', key: 'featured' },
  ].filter(Boolean) as { label: string; key: string }[];

  // Sort products client-side based on sp.sort
  let sorted = [...products];
  if (sp.sort === 'price_asc') sorted.sort((a: any, b: any) => a.sellingPrice - b.sellingPrice);
  else if (sp.sort === 'price_desc') sorted.sort((a: any, b: any) => b.sellingPrice - a.sellingPrice);

  return (
    <>
      <Header />
      <main className="w-full px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 mb-3 sm:mb-4 overflow-x-auto scrollbar-hide whitespace-nowrap">
          <Link href="/" className="hover:text-indigo-600 shrink-0">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium shrink-0">Products</span>
          {sp.q && <><span>/</span><span className="text-gray-700 shrink-0">"{sp.q}"</span></>}
        </nav>

        {/* Pass everything to client for mobile filter drawer + sort */}
        <ProductsClient
          sp={sp}
          topCats={topCats}
          brands={brands as any[]}
          total={total}
          page={page}
          activeFilters={activeFilters}
        >
          {/* Product grid — server rendered */}
          {sorted.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
              {sorted.map((p: any) => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No products found</p>
              <Link href="/products" className="text-indigo-600 text-sm hover:underline mt-2">Clear all filters</Link>
            </div>
          )}

        </ProductsClient>
      </main>
    </>
  );
}
