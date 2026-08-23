'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Link from 'next/link';

import API from '../../lib/api';
import { apiFetch } from '../../lib/apiFetch';
import { syncCartToServer } from '../../lib/cart-sync';

const fmt = (n: number) => n.toLocaleString('en-IN');

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    load();
  }, []);

  async function load() {
    const data = await apiFetch('/wishlist').then(r => r.json());
    setItems(data);
    setLoading(false);
  }

  async function remove(productId: string) {
    await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
    setItems(i => i.filter(x => x.product._id !== productId));
  }

  function addToCart(product: any) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((i: any) => i._id === product._id);
    if (idx > -1) cart[idx].qty += 1;
    else cart.push({ _id: product._id, name: product.name, price: product.sellingPrice, image: product.images?.[0]?.url, qty: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    syncCartToServer(cart);
    window.dispatchEvent(new Event('cart-updated'));
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-2.5 sm:px-4 py-5 sm:py-8">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">My Wishlist</h1>
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">❤️</p>
            <p className="mb-4">Your wishlist is empty</p>
            <Link href="/products" className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {items.map(({ product }: any) => {
              const discount = product.mrp > product.sellingPrice ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0;
              return (
                <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
                  <Link href={`/products/${product._id}`}>
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl text-gray-300">📦</div>
                      )}
                      {discount > 0 && <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full">{discount}% off</span>}
                    </div>
                  </Link>
                  <div className="p-2 sm:p-3">
                    <Link href={`/products/${product._id}`}>
                      <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600">{product.name}</p>
                    </Link>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                      <span className="font-bold text-gray-900 text-sm sm:text-base">₹{fmt(product.sellingPrice)}</span>
                      {discount > 0 && <span className="text-[10px] sm:text-xs text-gray-400 line-through">₹{fmt(product.mrp)}</span>}
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 mt-2">
                      {product.stock > 0 ? (
                        <button onClick={() => addToCart(product)} className="flex-1 bg-blue-600 text-white text-[11px] sm:text-xs py-1.5 rounded-lg hover:bg-blue-700">Add to Cart</button>
                      ) : (
                        <span className="flex-1 text-center text-[11px] sm:text-xs text-red-500 py-1.5">Out of Stock</span>
                      )}
                      <button onClick={() => remove(product._id)} className="text-red-400 hover:text-red-600 px-1.5 sm:px-2 text-sm">×</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
