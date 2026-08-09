'use client';
import { useEffect } from 'react';

const MAX = 10;
const KEY = 'recently_viewed';

export function useRecentlyViewed() {
  function getIds(): string[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
  function addId(id: string) {
    const ids = getIds().filter(i => i !== id);
    ids.unshift(id);
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
  }
  return { getIds, addId };
}

// Drop this into any product page to record the view
export default function ProductTracker({ productId }: { productId: string }) {
  const { addId } = useRecentlyViewed();
  useEffect(() => { addId(productId); }, [productId]);
  return null;
}
