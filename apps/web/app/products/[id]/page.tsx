import Header from '../../../components/Header';
import AddToCartButton from '../../../components/AddToCartButton';
import WishlistButton from '../../../components/WishlistButton';
import ReviewsSection from '../../../components/ReviewsSection';
import ImageGallery from '../../../components/ImageGallery';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API}/products/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const discount = product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : 0;

  const savings = product.mrp - product.sellingPrice;

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-indigo-600">Products</Link>
          {product.category && <><span>/</span><Link href={`/products?category=${product.category._id}`} className="hover:text-indigo-600">{product.category.name}</Link></>}
          <span>/</span>
          <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Images */}
          <ImageGallery images={product.images} name={product.name} />

          {/* Info */}
          <div className="space-y-5">
            {product.brand && (
              <Link href={`/products?brand=${product.brand._id}`}
                className="inline-block text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                {product.brand.name}
              </Link>
            )}

            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              <p className="text-sm text-gray-400 mt-1">SKU: {product.sku}</p>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                    <span className="bg-rose-100 text-rose-600 text-sm font-bold px-2.5 py-0.5 rounded-full">{discount}% OFF</span>
                  </>
                )}
              </div>
              {savings > 0 && (
                <p className="text-sm text-emerald-600 font-medium mt-1">You save ₹{savings.toLocaleString('en-IN')}</p>
              )}
              {product.gst > 0 && <p className="text-xs text-gray-400 mt-1">Inclusive of {product.gst}% GST</p>}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">
                    {product.stock <= 10 ? `Only ${product.stock} left in stock!` : 'In Stock'}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-600">Out of Stock</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <div className="flex-1">
                <AddToCartButton product={{ _id: product._id, name: product.name, sellingPrice: product.sellingPrice, image: product.images[0]?.url, stock: product.stock }} />
              </div>
              <WishlistButton productId={product._id} />
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">{product.shortDescription}</p>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              {product.warranty && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  {product.warranty}
                </div>
              )}
              {product.returnPolicy && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {product.returnPolicy}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                Free shipping above ₹500
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Secure payment
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Product Description</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}

        <ReviewsSection productId={product._id} />
      </main>
    </>
  );
}
