'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import API from '../lib/api';
import { apiFetch } from '../lib/apiFetch';

export default function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    apiFetch(`/wishlist/check/${productId}`)
      .then(r => r.json()).then(d => setInWishlist(d.inWishlist)).catch(() => {});
  }, [productId]);

  async function toggle() {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    if (inWishlist) {
      await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
      setInWishlist(false);
    } else {
      await apiFetch(`/wishlist/${productId}`, { method: 'POST' });
      setInWishlist(true);
    }
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`w-12 h-12 md:w-11 md:h-11 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 ${
        inWishlist
          ? 'bg-rose-50 border-rose-300 text-rose-500 scale-105'
          : 'bg-white border-gray-200 text-gray-400 hover:border-rose-300 hover:text-rose-400'
      }`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
      <svg className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
