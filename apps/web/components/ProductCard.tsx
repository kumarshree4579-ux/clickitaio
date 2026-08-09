'use client';
import Link from 'next/link';
import { useState } from 'react';

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
    isTrending?: boolean;
    stock?: number;
    brand?: { name: string };
  };
}

const fmt = (n: number) => n.toLocaleString('en-IN');

export default function ProductCard({ product }: Props) {
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discount = product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;
  const outOfStock = (product.stock ?? 1) === 0;
  const img = product.images?.[0];

  function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (outOfStock) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i: any) => i._id === product._id);
    if (idx > -1) cart[idx].qty += 1;
    else cart.push({ _id: product._id, name: product.name, price: product.sellingPrice, image: img?.url, qty: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Link href={`/products/${product._id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col">

      {/* Image — padding-bottom trick keeps 1:1 ratio without layout shift */}
      <div className="relative w-full bg-gray-50 overflow-hidden" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0">
          {img && !imgError ? (
            <img
              src={img.url}
              alt={img.alt || product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-white text-gray-500 text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 shadow-sm">Out of Stock</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{discount}% OFF</span>}
            {product.isNewArrival && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">NEW</span>}
            {product.isBestSeller && <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">🔥 HOT</span>}
            {product.isTrending && <span className="bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">TRENDING</span>}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1">
        {product.brand && (
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-0.5 truncate">{product.brand.name}</p>
        )}
        <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 flex-1 leading-snug">{product.name}</p>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm sm:text-base font-bold text-gray-900">₹{fmt(product.sellingPrice)}</span>
          {discount > 0 && <span className="text-[10px] sm:text-xs text-gray-400 line-through">₹{fmt(product.mrp)}</span>}
        </div>

        <button onClick={addToCart} disabled={outOfStock}
          className={`mt-2 w-full text-xs sm:text-sm font-medium py-1.5 sm:py-2 rounded-xl transition-all active:scale-95 ${
            outOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : added ? 'bg-emerald-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}>
          {outOfStock ? 'Out of Stock' : added ? '✓ Added!' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
