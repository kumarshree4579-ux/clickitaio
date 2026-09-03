'use client';
import { useState, useEffect } from 'react';
import { syncCartToServer } from '../lib/cart-sync';
import { useLocation } from '../lib/LocationContext';
import { useRouter } from 'next/navigation';

interface Props {
  product: { _id: string; name: string; sellingPrice: number; image?: string; stock: number };
}

export default function AddToCartButton({ product }: Props) {
  const router = useRouter();
  const [qtyInCart, setQtyInCart] = useState(0);
  const { isServiceable } = useLocation();

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

  function updateCart(delta: number) {
    if (isServiceable === false) return;
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i: any) => i._id === product._id);
    
    if (idx > -1) {
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
      }
    } else if (delta > 0) {
      cart.push({ _id: product._id, name: product.name, price: product.sellingPrice, image: product.image, qty: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    syncCartToServer(cart);
    window.dispatchEvent(new Event('cart-updated'));
  }

  if (isServiceable === false) {
    return (
      <button disabled className="w-full bg-red-50 text-red-400 py-3.5 rounded-xl font-medium cursor-not-allowed text-sm">
        Unserviceable
      </button>
    );
  }

  if (product.stock === 0 && qtyInCart === 0) {
    return (
      <button disabled className="w-full bg-gray-100 text-gray-400 py-3.5 rounded-xl font-medium cursor-not-allowed text-sm">
        Out of Stock
      </button>
    );
  }

  if (qtyInCart > 0) {
    return (
      <div className="w-full flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center justify-between bg-primary-light border border-primary-light rounded-xl px-2 py-2.5">
          <button onClick={() => updateCart(-1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-primary font-bold shadow-sm active:scale-95 transition-transform">-</button>
          <span className="text-sm font-bold text-indigo-900">{qtyInCart}</span>
          <button onClick={() => updateCart(1)} disabled={qtyInCart >= product.stock} className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg text-white font-bold shadow-sm disabled:opacity-50 active:scale-95 transition-transform">+</button>
        </div>
        <button onClick={() => router.push('/cart')} className="bg-gray-900 text-white rounded-xl px-4 py-3.5 text-sm font-bold shadow-sm flex items-center gap-1 hover:bg-gray-800 transition-colors active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Cart
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => updateCart(1)}
      className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white active:scale-95`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      Add to Cart
    </button>
  );
}
