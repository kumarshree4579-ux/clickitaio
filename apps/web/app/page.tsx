import Link from 'next/link';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getData() {
  try {
    const [featuredRes, newRes, catsRes] = await Promise.all([
      fetch(`${API}/products?limit=8&status=active`, { next: { revalidate: 60 } }),
      fetch(`${API}/products?limit=8&status=active`, { next: { revalidate: 60 } }),
      fetch(`${API}/categories`, { next: { revalidate: 60 } }),
    ]);
    const [featured, newArrivals, categories] = await Promise.all([featuredRes.json(), newRes.json(), catsRes.json()]);
    return { featured: featured.items || [], categories: categories.slice(0, 8) };
  } catch {
    return { featured: [], categories: [] };
  }
}

export default async function HomePage() {
  const { featured, categories } = await getData();

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-10">

        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-10 text-white text-center">
          <h1 className="text-4xl font-bold mb-2">Welcome to Ecom</h1>
          <p className="text-blue-100 mb-6">Discover amazing products at great prices</p>
          <Link href="/products" className="bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-full hover:bg-blue-50 transition-colors">
            Shop Now
          </Link>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Shop by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((c: any) => (
                <Link key={c._id} href={`/products?category=${c._id}`}
                  className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-2">🗂️</div>
                  <p className="text-sm font-medium text-gray-700">{c.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Featured Products</h2>
              <Link href="/products" className="text-sm text-blue-600 hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p: any) => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {featured.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🛍️</p>
            <p className="text-lg">No products yet. Check back soon!</p>
          </div>
        )}
      </main>
    </>
  );
}
