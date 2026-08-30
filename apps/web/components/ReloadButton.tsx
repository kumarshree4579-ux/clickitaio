'use client';
import React from 'react';

export default function ReloadButton({ label = 'Reload' }: { label?: string }) {
  return (
    <button 
      onClick={() => window.location.reload()}
      className="px-6 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
    >
      {label}
    </button>
  );
}
