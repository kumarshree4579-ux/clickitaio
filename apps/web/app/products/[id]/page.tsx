import Header from '../../../components/Header';
import AddToCartButton from '../../../components/AddToCartButton';
import WishlistButton from '../../../components/WishlistButton';
import ReviewsSection from '../../../components/ReviewsSection';
import ImageGallery from '../../../components/ImageGallery';
import RelatedProducts from '../../../components/RelatedProducts';
import RecentlyViewed from '../../../components/RecentlyViewed';
import ProductTracker from '../../../components/ProductTracker';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import API from '../../../lib/api';
const fmt = (n: number) => n.toLocaleString('en-IN');

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API}/products/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getReviewCount(id: string) {
  try {
    const res = await fetch(`${API}/reviews?product=${id}&status=approved&limit=1`, { cache: 'no-store' });
    const d = await res.json();
    return d.total || 0;
  } catch { return 0; }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, reviewCount] = await Promise.all([getProduct(id), getReviewCount(id)]);
  if (!product) notFound();

  const discount = product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;
  const savings = product.mrp - product.sellingPrice;

  const badges = [
    product.isFeatured && { label: 'Featured', cls: 'bg-violet-100 text-violet-700' },
    product.isNewArrival && { label: 'New', cls: 'bg-emerald-100 text-emerald-700' },
    product.isBestSeller && { label: '🔥 Hot', cls: 'bg-amber-100 text-amber-700' },
    product.isTrending && { label: 'Trending', cls: 'bg-rose-100 text-rose-700' },
  ].filter(Boolean) as { label: string; cls: string }[];

  return (
    <>


      <main className="bg-gray-50 min-h-screen pb-24 md:pb-8">

        {/* ── Breadcrumb ── */}
        <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5">
          <nav className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-400 overflow-x-auto scrollbar-hide whitespace-nowrap">
            <Link href="/" className="hover:text-indigo-600 shrink-0">Home</Link>
            <span className="shrink-0">/</span>
            <Link href="/products" className="hover:text-indigo-600 shrink-0">Products</Link>
            {product.category && <>
              <span className="shrink-0">/</span>
              <Link href={`/products?category=${product.category._id}`} className="hover:text-indigo-600 shrink-0">{product.category.name}</Link>
            </>}
            <span className="shrink-0">/</span>
            <span className="text-gray-600 truncate max-w-[140px] sm:max-w-xs">{product.name}</span>
          </nav>
        </div>

        {/* ── Main content ── */}
        <div className="max-w-6xl mx-auto px-3 sm:px-6 mt-3 sm:mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 lg:gap-10">

            {/* ── Images ── */}
            <div className="md:sticky md:top-20 md:self-start">
              <div className="bg-white rounded-2xl p-2 sm:p-3 shadow-sm">
                <ImageGallery images={product.images} name={product.name} />
              </div>
            </div>

            {/* ── Info ── */}
            <div className="flex flex-col gap-3">

              {/* Brand + badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {product.brand && (
                  <Link href={`/products?brand=${product.brand._id}`}
                    className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full hover:bg-indigo-100">
                    {product.brand.name}
                  </Link>
                )}
                {badges.map(b => (
                  <span key={b.label} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${b.cls}`}>{b.label}</span>
                ))}
              </div>

              {/* Name */}
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-[11px] text-gray-400">SKU: {product.sku}</p>
                  {reviewCount > 0 && (
                    <a href="#reviews" className="flex items-center gap-1 text-[11px] text-amber-500 hover:text-amber-600">
                      {'★'.repeat(5)}
                      <span className="text-gray-400 ml-0.5">({reviewCount})</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{fmt(product.sellingPrice)}</span>
                  {discount > 0 && (
                    <>
                      <span className="text-sm sm:text-base text-gray-400 line-through">₹{fmt(product.mrp)}</span>
                      <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>
                    </>
                  )}
                </div>
                {savings > 0 && <p className="text-xs text-emerald-600 font-semibold mt-1">🎉 You save ₹{fmt(savings)}</p>}
                {product.gst > 0 && <p className="text-[11px] text-gray-400 mt-0.5">Incl. {product.gst}% GST</p>}
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 px-1">
                {product.stock > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-sm font-medium text-emerald-700">
                      {product.stock <= 5 ? `⚡ Only ${product.stock} left!` : product.stock <= 10 ? `Only ${product.stock} left` : 'In Stock'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-sm font-medium text-red-600">Out of Stock</span>
                  </>
                )}
              </div>

              {/* CTA — desktop only, mobile uses sticky bar */}
              <div className="hidden md:flex gap-3">
                <div className="flex-1">
                  <AddToCartButton product={{ _id: product._id, name: product.name, sellingPrice: product.sellingPrice, image: product.images[0]?.url, stock: product.stock }} />
                </div>
                <WishlistButton productId={product._id} />
              </div>

              {/* Short description */}
              {product.shortDescription && (
                <p className="text-gray-600 text-sm leading-relaxed px-0.5">{product.shortDescription}</p>
              )}

              {/* Trust pills */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🚚', text: 'Free shipping ₹500+' },
                  { icon: '🔒', text: 'Secure payment' },
                  product.warranty && { icon: '🛡️', text: product.warranty },
                  product.returnPolicy && { icon: '↩️', text: product.returnPolicy },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.text} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-sm">
                    <span className="text-sm shrink-0">{item.icon}</span>
                    <span className="text-[11px] sm:text-xs text-gray-600 leading-tight">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-0.5">
                  {product.tags.map((tag: string) => (
                    <Link key={tag} href={`/products?q=${encodeURIComponent(tag)}`}
                      className="text-[11px] bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 px-2.5 py-1 rounded-full transition-colors">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Description ── */}
          {product.description && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">Product Description</h2>
              </div>
              <div className="px-4 sm:px-5 py-4">
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            </div>
          )}

          {/* ── Specs ── */}
          {(product.weight || product.warranty || product.returnPolicy || product.sku) && (
            <div className="mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">Specifications</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  product.weight && ['Weight', `${product.weight}g`],
                  product.warranty && ['Warranty', product.warranty],
                  product.returnPolicy && ['Returns', product.returnPolicy],
                  product.sku && ['SKU', product.sku],
                ].filter(Boolean).map(([label, value]: any) => (
                  <div key={label} className="flex items-start px-4 sm:px-5 py-3 text-sm gap-4">
                    <span className="w-24 sm:w-32 text-gray-400 shrink-0 text-xs sm:text-sm">{label}</span>
                    <span className="text-gray-800 font-medium text-xs sm:text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Reviews ── */}
          <div className="mt-3" id="reviews">
            <ReviewsSection productId={product._id} />
          </div>

          {/* ── Related ── */}
          {product.category && (
            <RelatedProducts categoryId={product.category._id} categoryName={product.category.name} excludeId={product._id} />
          )}

          {/* ── Recently viewed ── */}
          <RecentlyViewed excludeId={product._id} />

          <ProductTracker productId={product._id} />
        </div>

        {/* ── Mobile sticky CTA ── */}
        <div className="fixed bottom-[60px] left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 px-3 py-2.5 flex items-center gap-2.5 shadow-[0_-2px_16px_rgba(0,0,0,0.08)]">
          <div className="shrink-0 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-none">₹{fmt(product.sellingPrice)}</p>
            {discount > 0 && <p className="text-[10px] text-gray-400 line-through mt-0.5">₹{fmt(product.mrp)}</p>}
          </div>
          <div className="flex-1 min-w-0">
            <AddToCartButton product={{ _id: product._id, name: product.name, sellingPrice: product.sellingPrice, image: product.images[0]?.url, stock: product.stock }} />
          </div>
          <WishlistButton productId={product._id} />
        </div>
      </main>
    </>
  );
}
