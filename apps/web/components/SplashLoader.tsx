'use client';
import { useEffect, useState } from 'react';

export default function SplashLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1200);
    const remove = setTimeout(() => setVisible(false), 1600);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-400 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Logo */}
      <img
        src="/logo192.png"
        alt="Daily Basket"
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain"
      />

      {/* Brand name */}
      <div className="mt-4 text-center">
        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
          <span className="text-indigo-600">Daily</span>
          <span className="text-gray-900"> Basket</span>
        </h1>
      </div>

      {/* 3 dot loader — 1 big center, 2 small sides */}
      <div className="mt-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
        <span className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
        <span className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
      </div>
    </div>
  );
}
