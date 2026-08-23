'use client';
import { useState } from 'react';

interface ImageSpec {
  label: string;
  ratio: string;
  width: number;
  height: number;
  maxSize: string;
  tip: string;
}

const IMAGE_SPECS: Record<string, ImageSpec> = {
  product: {
    label: 'Product Image',
    ratio: '1:1',
    width: 800,
    height: 800,
    maxSize: '2MB',
    tip: 'Square images work best. Use white/clean background for consistency.',
  },
  banner: {
    label: 'Hero Banner',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    maxSize: '3MB',
    tip: 'Wide landscape banners. Keep text/key content in center 60% for mobile crop.',
  },
  mobileBanner: {
    label: 'Mobile Banner',
    ratio: '2:1',
    width: 800,
    height: 400,
    maxSize: '1MB',
    tip: 'Shorter aspect ratio optimized for mobile screens.',
  },
  category: {
    label: 'Category Icon',
    ratio: '1:1',
    width: 400,
    height: 400,
    maxSize: '500KB',
    tip: 'Circular crop applied. Center subject with padding around edges.',
  },
  brand: {
    label: 'Brand Logo',
    ratio: '3:2',
    width: 600,
    height: 400,
    maxSize: '500KB',
    tip: 'Transparent PNG preferred. Logo should fill at least 60% of the canvas.',
  },
  thumbnail: {
    label: 'Thumbnail',
    ratio: '1:1',
    width: 300,
    height: 300,
    maxSize: '200KB',
    tip: 'Used in search results and cart. Keep it clear and recognizable at small size.',
  },
};

/**
 * Shows image dimension/aspect ratio guide for a specific image type.
 * Usage: <ImageGuide type="product" /> or <ImageGuide type="banner" />
 */
export function ImageGuide({ type, className = '' }: { type: keyof typeof IMAGE_SPECS; className?: string }) {
  const spec = IMAGE_SPECS[type];
  if (!spec) return null;

  return (
    <div className={`flex items-center gap-2 text-[11px] text-gray-400 ${className}`}>
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>{spec.ratio} &middot; {spec.width}&times;{spec.height}px &middot; Max {spec.maxSize}</span>
    </div>
  );
}

/**
 * Full image guidelines panel — shows all image specs at once.
 * Use in Settings or as a helper popup.
 */
export default function ImageGuidePanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Image Size Guide
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Image Size Guide</h2>
                <p className="text-xs text-gray-500 mt-0.5">Recommended dimensions for all image types</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* Specs */}
            <div className="p-5 space-y-3">
              {Object.entries(IMAGE_SPECS).map(([key, spec]) => (
                <div key={key} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm">{spec.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{spec.tip}</p>
                    </div>
                    {/* Visual ratio preview */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-md bg-gray-50 flex items-center justify-center"
                        style={{
                          width: spec.ratio === '1:1' ? 40 : spec.ratio === '16:9' ? 56 : spec.ratio === '2:1' ? 50 : spec.ratio === '3:2' ? 48 : 40,
                          height: spec.ratio === '1:1' ? 40 : spec.ratio === '16:9' ? 32 : spec.ratio === '2:1' ? 25 : spec.ratio === '3:2' ? 32 : 40,
                        }}
                      >
                        <span className="text-[9px] font-bold text-gray-400">{spec.ratio}</span>
                      </div>
                    </div>
                  </div>
                  {/* Specs row */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Size</span>
                      <span className="text-xs font-semibold text-gray-700">{spec.width} &times; {spec.height}px</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Ratio</span>
                      <span className="text-xs font-semibold text-gray-700">{spec.ratio}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Max</span>
                      <span className="text-xs font-semibold text-gray-700">{spec.maxSize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-5 py-3 rounded-b-2xl">
              <p className="text-[11px] text-gray-400 text-center">
                Images are auto-compressed on upload. PNG/JPG/WebP supported.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
