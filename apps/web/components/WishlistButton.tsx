'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/wishlist/check/${productId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setInWishlist(d.inWishlist)).catch(() => {});
  }, [productId]);

  async function toggle() {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    if (inWishlist) {
      await fetch(`${API}/wishlist/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setInWishlist(false);
    } else {
      await fetch(`${API}/wishlist/${productId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setInWishlist(true);
    }
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${inWishlist ? 'bg-red-50 border-red-300 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400'}`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
      {inWishlist ? '❤️' : '🤍'}
    </button>
  );
}
