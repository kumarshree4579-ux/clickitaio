import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getData(searchParams: any) {
  const params = new URLSearchParams({ limit: '20', status: 'active', page: searchParams.page || '1' });
  if (searchParams.q) params.set('q', searchParams.q);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.brand) params.set('brand', searchParams.brand);
  try {
    const [prodRes, catsRes, brandsRes] = await Promise.all([
      fetch(`${API}/products?${params}`, { next: { revalidate: 30 } }),
      fetch(`${API}/categories`, { next: { revalidate: 60 } }),
      fetch(`${API}/brands`, { next: { revalidate: 60 } }),
    ]);
    const [data, categories, brands] = await Promise.all([prodRes.json(), catsRes.json(), brandsRes.json()]);
    return { products: data.items || [], total: data.total || 0, categories, brands };
  } catch {
    return { products: [], total: 0, categories: [], brands: [] };
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: any }) {
  const { products, total, categories, brands } = await getData(searchParams);
  const page = parseInt(searchParams.page || '1');

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 flex gap-6">

        {/* Sidebar Filters */}
        <aside className="w-48 shrink-0 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">Categories</h3>
            <div className="space-y-1">
              <Link href="/products" className="block text-sm text-gray-600 hover:text-blue-600 py-0.5">All</Link>
              {categories.map((c: any) => (
                <Link key={c._id} href={`/products?category=${c._id}`}
                  className={`block text-sm py-0.5 hover:text-blue-600 ${searchParams.category === c._id ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
          {brands.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Brands</h3>
              <div className="space-y-1">
                {brands.map((b: any) => (
                  <Link key={b._id} href={`/products?brand=${b._id}`}
                    className={`block text-sm py-0.5 hover:text-blue-600 ${searchParams.brand === b._id ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{total} products found</p>
            {searchParams.q && <p className="text-sm text-gray-600">Results for: <strong>{searchParams.q}</strong></p>}
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p>No products found</p>
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && (
                <Link href={`/products?page=${page - 1}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">← Prev</Link>
              )}
              {page * 20 < total && (
                <Link href={`/products?page=${page + 1}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">Next →</Link>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
