import Header from '../../../components/Header';
import AddToCartButton from '../../../components/AddToCartButton';
import WishlistButton from '../../../components/WishlistButton';
import ReviewsSection from '../../../components/ReviewsSection';
import { notFound } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const discount = product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : 0;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
              {product.images[0] ? (
                <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img: any, i: number) => (
                  <img key={i} src={img.url} alt={img.alt || product.name}
                    className="w-16 h-16 object-cover rounded-lg border cursor-pointer hover:border-blue-500" />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            {product.brand && <p className="text-sm text-blue-600 font-medium">{product.brand.name}</p>}
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500">SKU: {product.sku}</p>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">₹{product.sellingPrice}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{product.mrp}</span>
                  <span className="bg-red-100 text-red-600 text-sm px-2 py-0.5 rounded-full">{discount}% off</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              {product.stock > 0 ? (
                <span className="text-green-600 font-medium">✓ In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-red-500 font-medium">✗ Out of Stock</span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-gray-600 text-sm">{product.shortDescription}</p>
            )}

            <AddToCartButton product={{ _id: product._id, name: product.name, sellingPrice: product.sellingPrice, image: product.images[0]?.url, stock: product.stock }} />
            <WishlistButton productId={product._id} />

            {product.warranty && (
              <p className="text-xs text-gray-500">🛡️ Warranty: {product.warranty}</p>
            )}
            {product.returnPolicy && (
              <p className="text-xs text-gray-500">↩️ Return: {product.returnPolicy}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-10 bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3">Description</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}

        <ReviewsSection productId={product._id} />
      </main>
    </>
  );
}
