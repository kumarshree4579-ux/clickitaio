'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

import API from '../lib/api';

export default function HeroBanner() {
  const [banners, setBanners] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`${API}/banners?type=slider`)
      .then(r => r.json())
      .then(d => setBanners(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length]);
  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length);

  // Auto-advance every 4s
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [banners.length, next]);

  if (!banners.length) {
    return (
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-indigo-200 text-sm font-medium mb-3 uppercase tracking-wider">Welcome to Ecom Store</p>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Shop the Best<br />
            <span className="text-indigo-200">Products Online</span>
          </h1>
          <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">Discover amazing products at unbeatable prices. Free shipping on orders above ₹500.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/products" className="bg-white text-indigo-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">Shop Now</Link>
            <Link href="/products?newArrival=true" className="border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">New Arrivals</Link>
          </div>
        </div>
      </div>
    );
  }

  const b = banners[current];

  return (
    <div className="relative h-[420px] sm:h-[500px] overflow-hidden bg-gray-900 select-none">
      {/* Slides */}
      {banners.map((banner, i) => (
        <div key={banner._id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 max-w-lg leading-tight drop-shadow-lg">
            {b.title}
          </h1>
          {b.link && (
            <Link href={b.link}
              className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
              Shop Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          )}
        </div>
      </div>

      {/* Arrows — only if multiple banners */}
      {banners.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
