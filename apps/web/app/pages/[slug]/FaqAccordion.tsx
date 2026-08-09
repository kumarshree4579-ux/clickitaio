'use client';
import { useState } from 'react';

interface Item { q: string; a: string; }

export default function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}
          className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${open === i ? 'border-indigo-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left gap-4">
            <span className={`font-semibold text-sm sm:text-base leading-snug ${open === i ? 'text-indigo-700' : 'text-gray-800'}`}>
              {item.q}
            </span>
            <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${open === i ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-5">
              <div className="h-px bg-gray-100 mb-4" />
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
