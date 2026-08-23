'use client';
import { useEffect, useState } from 'react';

export default function SplashLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1000);
    const remove = setTimeout(() => setVisible(false), 1400);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Logo with spinner ring */}
      <div className="relative">
        {/* Spinning ring */}
        <div className="absolute inset-[-8px] rounded-full border-[3px] border-gray-100 border-t-indigo-600 animate-spin" />
        {/* Logo */}
        <img
          src="/logo192.png"
          alt="Daily Basket"
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain relative z-10"
        />
      </div>

      {/* Brand name */}
      <div className="mt-5 text-center">
        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
          <span className="text-indigo-600">Daily</span>
          <span className="text-gray-900"> Basket</span>
        </h1>
        <p className="text-[11px] text-gray-400 mt-1 font-medium">Loading...</p>
      </div>
    </div>
  );
}
