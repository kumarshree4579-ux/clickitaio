'use client';
import { useState, useRef } from 'react';

export default function ImageGallery({ images, name }: { images: any[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef(0);

  if (!images?.length) {
    return (
      <div className="w-full bg-gray-100 rounded-2xl flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
        <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  function prev() { setActive(i => (i - 1 + images.length) % images.length); }
  function next() { setActive(i => (i + 1) % images.length); }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {/* Main image */}
        <div
          className="relative w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 cursor-pointer"
          style={{ aspectRatio: '1/1' }}
          onClick={() => setZoomed(true)}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
          }}
        >
          <img
            src={images[active].url}
            alt={images[active].alt || name}
            className="w-full h-full object-cover"
          />

          {/* Always-visible arrows on mobile, hover on desktop */}
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center text-gray-700 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation z-10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center text-gray-700 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation z-10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setActive(i); }}
                    className={`rounded-full transition-all touch-manipulation ${i === active ? 'w-4 h-1.5 bg-indigo-600' : 'w-1.5 h-1.5 bg-white/70'}`} />
                ))}
              </div>
            </>
          )}

          {/* Zoom icon — desktop only */}
          <div className="absolute top-2.5 right-2.5 hidden md:flex bg-black/30 text-white text-[10px] px-2 py-1 rounded-full items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Zoom
          </div>
        </div>

        {/* Thumbnails — hidden when only 1 image */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {images.map((img: any, i: number) => (
              <button key={i} onClick={() => setActive(i)} touch-manipulation="true"
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all touch-manipulation ${
                  i === active ? 'border-indigo-500' : 'border-transparent opacity-50 hover:opacity-80'
                }`}>
                <img src={img.url} alt={img.alt || name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {zoomed && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setZoomed(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl touch-manipulation z-10">×</button>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white touch-manipulation z-10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={e => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white touch-manipulation z-10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
          <img src={images[active].url} alt={images[active].alt || name}
            className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()} />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">{active + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}
