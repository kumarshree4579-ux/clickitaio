'use client';
import Link from 'next/link';
import { syncCartToServer } from '../lib/cart-sync';
import { useState, useEffect } from 'react';
import { useLocation } from '../lib/LocationContext';
import { useRouter } from 'next/navigation';

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
  const { isServiceable } = useLocation();

  const discount = product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;
  const outOfStock = (product.stock ?? 1) === 0;
  const img = product.images?.[0];

  const [qtyInCart, setQtyInCart] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const updateQty = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const item = cart.find((i: any) => i._id === product._id);
      setQtyInCart(item ? item.qty : 0);
    };
    updateQty();
    window.addEventListener('cart-updated', updateQty);
    return () => window.removeEventListener('cart-updated', updateQty);
  }, [product._id]);

  function updateCart(e: React.MouseEvent, delta: number) {
    e.preventDefault();
    if (isServiceable === false) return;
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i: any) => i._id === product._id);
    
    if (idx > -1) {
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
      }
    } else if (delta > 0) {
      cart.push({ _id: product._id, name: product.name, price: product.sellingPrice, image: img?.url, qty: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    syncCartToServer(cart);
    window.dispatchEvent(new Event('cart-updated'));
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
        <p className="text-[13px] sm:text-sm font-medium text-gray-800 line-clamp-2 flex-1 leading-snug">{product.name}</p>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[15px] sm:text-base font-bold text-gray-900">₹{fmt(product.sellingPrice)}</span>
          <span className="text-[10px] sm:text-xs text-gray-400 line-through">{discount > 0 ? `₹${fmt(product.mrp)}` : ''}</span>
        </div>
        {isServiceable === false ? (
          <button disabled className="mt-2 w-full text-xs sm:text-sm font-medium py-1.5 sm:py-2 rounded-xl bg-red-50 text-red-400 cursor-not-allowed">
            Unserviceable
          </button>
        ) : qtyInCart > 0 ? (
          <div className="flex gap-1.5 mt-2 w-full items-center">
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-1.5 py-1 flex-1">
              <button onClick={(e) => updateCart(e, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded text-indigo-600 font-bold shadow-sm active:scale-95 transition-transform">-</button>
              <span className="text-xs font-bold text-indigo-900">{qtyInCart}</span>
              <button onClick={(e) => updateCart(e, 1)} disabled={qtyInCart >= (product.stock || 1)} className="w-6 h-6 flex items-center justify-center bg-indigo-600 rounded text-white font-bold shadow-sm disabled:opacity-50 active:scale-95 transition-transform">+</button>
            </div>
            <button onClick={(e) => { e.preventDefault(); router.push('/cart'); }} className="bg-emerald-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-emerald-600 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
          </div>
        ) : (
          <button onClick={(e) => updateCart(e, 1)} disabled={outOfStock}
            className={`mt-2 w-full text-xs sm:text-sm font-medium py-1.5 sm:py-2 rounded-xl transition-all active:scale-95 ${
              outOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            }`}>
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )}
      </div>
    </Link>
  );
}
