'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Route-change loader bar at the top of the page.
 * Shows a slim animated progress bar when navigating between pages.
 */
export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When pathname changes, briefly show loader then hide
    setLoading(true);
    setProgress(30);

    const t1 = setTimeout(() => setProgress(70), 100);
    const t2 = setTimeout(() => setProgress(100), 300);
    const t3 = setTimeout(() => { setLoading(false); setProgress(0); }, 500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out rounded-r-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
