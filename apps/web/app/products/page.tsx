import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import Link from 'next/link';

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getData(searchParams: any) {
  const params = new URLSearchParams({ limit: '20', status: 'active', page: searchParams.page || '1' });
  if (searchParams.q) params.set('q', searchParams.q);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.brand) params.set('brand', searchParams.brand);
  if (searchParams.newArrival) params.set('newArrival', searchParams.newArrival);
  if (searchParams.bestSeller) params.set('bestSeller', searchParams.bestSeller);
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

  function buildUrl(extra: Record<string, string>) {
    const p = new URLSearchParams();
    if (sp.q) p.set('q', sp.q);
    if (sp.category) p.set('category', sp.category);
    if (sp.brand) p.set('brand', sp.brand);
    Object.entries(extra).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    return `/products?${p.toString()}`;
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Products</span>
          {sp.q && <><span>/</span><span className="text-gray-900">"{sp.q}"</span></>}
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-52 shrink-0 hidden md:block">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-6 sticky top-24">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</p>
                <div className="space-y-0.5">
                  <Link href="/products"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${!sp.category ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    All Products
                  </Link>
                  {topCats.map((c: any) => (
                    <Link key={c._id} href={buildUrl({ category: c._id, page: '1' })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${sp.category === c._id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {c.image && <img src={c.image} alt={c.name} className="w-5 h-5 rounded object-cover" />}
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              {brands.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Brands</p>
                  <div className="space-y-0.5">
                    {(brands as any[]).map((b: any) => (
                      <Link key={b._id} href={buildUrl({ brand: b._id, page: '1' })}
                        className={`flex items-center px-3 py-2 rounded-xl text-sm transition-colors ${sp.brand === b._id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        {b.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {sp.q ? `Results for "${sp.q}"` : 'All Products'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{total} products found</p>
              </div>
              {(sp.category || sp.brand || sp.q) && (
                <Link href="/products" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Clear filters
                </Link>
              )}
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p: any) => <ProductCard key={p._id} product={p} />)}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <p className="text-gray-500 font-medium">No products found</p>
                <Link href="/products" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">Clear filters</Link>
              </div>
            )}

            {total > 20 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                {page > 1 && (
                  <Link href={buildUrl({ page: String(page - 1) })}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Previous
                  </Link>
                )}
                <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
                {page * 20 < total && (
                  <Link href={buildUrl({ page: String(page + 1) })}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
