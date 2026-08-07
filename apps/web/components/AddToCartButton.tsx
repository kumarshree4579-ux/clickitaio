'use client';
import { useState } from 'react';

interface Props {
  product: { _id: string; name: string; sellingPrice: number; image?: string; stock: number };
}

export default function AddToCartButton({ product }: Props) {
  const [added, setAdded] = useState(false);

  function addToCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i: any) => i._id === product._id);
    if (idx > -1) cart[idx].qty += 1;
    else cart.push({ _id: product._id, name: product.name, price: product.sellingPrice, image: product.image, qty: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (product.stock === 0) {
    return (
      <button disabled className="w-full bg-gray-100 text-gray-400 py-3.5 rounded-xl font-medium cursor-not-allowed text-sm">
        Out of Stock
      </button>
    );
  }

  return (
    <button onClick={addToCart}
      className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${added ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'}`}>
      {added ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          Added to Cart!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Add to Cart
        </>
      )}
    </button>
  );
}
