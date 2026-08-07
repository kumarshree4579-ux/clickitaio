'use client';
import { useState } from 'react';

export default function ImageGallery({ images, name }: { images: any[]; name: string }) {
  const [active, setActive] = useState(0);

  if (!images?.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <svg className="w-20 h-20 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
        <img src={images[active].url} alt={images[active].alt || name} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img: any, i: number) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${i === active ? 'border-indigo-500' : 'border-gray-100 hover:border-indigo-300'}`}>
              <img src={img.url} alt={img.alt || name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
