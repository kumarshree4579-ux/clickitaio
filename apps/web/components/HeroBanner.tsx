'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

import API from '../lib/api';

export default function HeroBanner() {
  const [banners, setBanners] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    fetch(`${API}/banners?type=slider`)
      .then(r => r.json())
      .then(d => setBanners(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % banners.length), [banners.length]);

  // Auto-advance every 4s
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [banners.length, next]);

  // Touch swipe support for mobile
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  }

  if (!banners.length) {
    return (
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 py-10 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-indigo-200 text-[11px] sm:text-sm font-medium mb-2 sm:mb-3 uppercase tracking-wider">Welcome to Daily Basket</p>
          <h1 className="text-2xl sm:text-5xl font-bold text-white mb-3 sm:mb-6 leading-tight">
            Shop the Best<br />
            <span className="text-indigo-200">Products Online</span>
          </h1>
          <p className="text-indigo-100 text-sm sm:text-lg mb-5 sm:mb-8 max-w-xl mx-auto">Discover amazing products at unbeatable prices.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/products" className="bg-white text-indigo-600 font-semibold px-6 sm:px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg text-sm sm:text-base">Shop Now</Link>
            <Link href="/products?newArrival=true" className="border-2 border-white/40 text-white font-semibold px-6 sm:px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm sm:text-base">New Arrivals</Link>
          </div>
        </div>
      </div>
    );
  }

  const b = banners[current];

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-100 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Aspect ratio container — 2:1 on mobile, 21:9 on desktop */}
      <div className="relative w-full" style={{ paddingBottom: 'clamp(180px, 48vw, 420px)' }}>
        {/* Slides */}
        {banners.map((banner, i) => (
          <div key={banner._id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay — lighter on mobile for visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent sm:bg-gradient-to-r sm:from-black/60 sm:via-black/25 sm:to-transparent" />
          </div>
        ))}

        {/* Content — positioned at bottom on mobile, center-left on desktop */}
        <div className="absolute inset-0 z-20 flex items-end sm:items-center">
          <div className="w-full px-4 sm:px-8 lg:px-12 pb-10 sm:pb-0 max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-lg max-w-md sm:max-w-lg">
              {b.title}
            </h2>
            {b.link && (
              <Link href={b.link}
                className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg mt-3 sm:mt-4 text-[13px] sm:text-sm">
                Shop Now
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </Link>
            )}
          </div>
        </div>

        {/* No arrow buttons — swipe on mobile, auto-advance handles navigation */}

        {/* Dots — no pointer/arrows, just indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 sm:gap-2 pointer-events-none">
            {banners.map((_, i) => (
              <div key={i}
                className={`rounded-full transition-all ${i === current ? 'w-5 sm:w-6 h-1.5 sm:h-2 bg-white' : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
