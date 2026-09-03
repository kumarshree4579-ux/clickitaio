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
    rating?: number; // Added new property
    reviewsCount?: number; // Added new property
  };
  compact?: boolean;
}

const fmt = (n: number) => n.toLocaleString('en-IN');

export default function ProductCard({ product, compact = false }: Props) {
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

  // Placeholder for ratings if backend doesn't provide them yet
  const rating = product.rating || 4.5;
  const reviewsCount = product.reviewsCount || Math.floor(Math.random() * 100) + 10;

  return (
    <Link href={`/products/${product._id}`}
      className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col">

      {/* Image Container */}
      <div 
        className={`relative w-full bg-gray-50 overflow-hidden shrink-0 ${compact ? 'h-[140px] sm:h-[180px]' : ''}`} 
        style={compact ? {} : { paddingBottom: '100%' }}
      >
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
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-white text-gray-500 text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-gray-200 shadow-sm">Out of Stock</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && <span className="bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">{discount}% OFF</span>}
            {product.isNewArrival && <span className="bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">NEW</span>}
            {product.isBestSeller && <span className="bg-amber-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">🔥 HOT</span>}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className={`flex flex-col flex-1 ${compact ? 'p-2 sm:p-2.5' : 'p-2 sm:p-3'}`}>
        
        {/* Brand & Ratings */}
        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
          {product.brand ? (
            <p className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-wide truncate pr-2">{product.brand.name}</p>
          ) : (
            <div />
          )}
          {/* Mock Rating Display */}
          <div className="flex items-center gap-0.5 shrink-0 bg-green-50 px-1 py-0.5 rounded">
            <span className="text-[8px] sm:text-[9px] font-bold text-green-700">{rating}</span>
            <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          </div>
        </div>

        <p className={`font-medium text-gray-800 line-clamp-2 leading-tight flex-1 ${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'}`}>{product.name}</p>

        <div className="mt-1 flex items-baseline gap-1 flex-wrap">
          <span className={`${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-bold text-gray-900`}>₹{fmt(product.sellingPrice)}</span>
          {discount > 0 && <span className="text-[9px] sm:text-[10px] text-gray-400 line-through">₹{fmt(product.mrp)}</span>}
        </div>
        
        {isServiceable === false ? (
          <button disabled className={`mt-1.5 w-full font-medium rounded-md bg-red-50 text-red-400 cursor-not-allowed ${compact ? 'text-[10px] py-1' : 'text-[11px] sm:text-sm py-1 sm:py-2'}`}>
            Unserviceable
          </button>
        ) : qtyInCart > 0 ? (
          <div className="flex gap-1 mt-1.5 w-full items-center">
            <div className="flex items-center justify-between bg-primary-light border border-primary-light rounded-md px-1 py-0.5 sm:py-1 flex-1">
              <button onClick={(e) => updateCart(e, -1)} className={`flex items-center justify-center bg-white rounded text-primary font-bold shadow-sm active:scale-95 transition-transform ${compact ? 'w-4 h-4 text-xs' : 'w-5 h-5 sm:w-7 sm:h-7 text-sm sm:text-base'}`}>-</button>
              <span className="text-[10px] sm:text-xs font-bold text-indigo-900">{qtyInCart}</span>
              <button onClick={(e) => updateCart(e, 1)} disabled={qtyInCart >= (product.stock || 1)} className={`flex items-center justify-center bg-primary rounded text-white font-bold shadow-sm disabled:opacity-50 active:scale-95 transition-transform ${compact ? 'w-4 h-4 text-xs' : 'w-5 h-5 sm:w-7 sm:h-7 text-sm sm:text-base'}`}>+</button>
            </div>
            <button onClick={(e) => { e.preventDefault(); router.push('/cart'); }} className={`bg-emerald-500 text-white rounded-md font-bold hover:bg-emerald-600 flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0 ${compact ? 'px-1.5 py-0.5' : 'px-2 sm:px-2.5 py-1 sm:py-1.5'}`}>
              <svg className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
          </div>
        ) : (
          <button onClick={(e) => updateCart(e, 1)} disabled={outOfStock}
            className={`mt-1.5 w-full font-medium rounded-md transition-all active:scale-95 ${compact ? 'text-[10px] py-1' : 'text-[11px] sm:text-sm py-1.5 sm:py-2'} ${
              outOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-dark text-white shadow-sm'
            }`}>
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )}
      </div>
    </Link>
  );
}
