'use client';
import Link from 'next/link';

interface Props {
  product: {
    _id: string;
    name: string;
    mrp: number;
    sellingPrice: number;
    images: { url: string; alt?: string }[];
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isFeatured?: boolean;
    stock?: number;
    brand?: { name: string };
  };
}

// Consistent number formatting — avoids SSR/client locale mismatch
function fmt(n: number) {
  return n.toLocaleString('en-IN');
}

export default function ProductCard({ product }: Props) {
  const discount = product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : 0;

  function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i: any) => i._id === product._id);
    if (idx > -1) cart[idx].qty += 1;
    else cart.push({ _id: product._id, name: product.name, price: product.sellingPrice, image: product.images[0]?.url, qty: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  }

  return (
    <Link href={`/products/${product._id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">

      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.images[0] ? (
          <img src={product.images[0].url} alt={product.images[0].alt || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-14 h-14 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>
          )}
          {product.isNewArrival && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
          )}
          {product.isBestSeller && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">BESTSELLER</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {product.brand && (
          <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide mb-0.5">{product.brand.name}</p>
        )}
        <p className="text-sm font-medium text-gray-800 line-clamp-2 flex-1 leading-snug">{product.name}</p>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">₹{fmt(product.sellingPrice)}</span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">₹{fmt(product.mrp)}</span>
          )}
        </div>

        {(product.stock ?? 1) === 0 ? (
          <div className="mt-2.5 w-full text-center text-xs text-gray-400 py-2 border border-gray-100 rounded-xl bg-gray-50">
            Out of Stock
          </div>
        ) : (
          <button onClick={addToCart}
            className="mt-2.5 w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-medium py-2 rounded-xl transition-all">
            Add to Cart
          </button>
        )}
      </div>
    </Link>
  );
}
