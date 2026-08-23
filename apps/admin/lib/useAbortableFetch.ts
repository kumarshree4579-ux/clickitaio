'use client';
import { useRef, useCallback, useEffect } from 'react';
import { apiFetch } from './apiFetch';

/**
 * Hook that provides an `abortableFetch` function.
 * Automatically cancels the previous request when a new one is made,
 * and cancels all pending requests on unmount.
 * 
 * Solves: clicking Products → Products → Products Tab rapidly
 * causing stale data or race conditions.
 */
export function useAbortableFetch() {
  const controllerRef = useRef<AbortController | null>(null);

  const abortableFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    // Cancel any in-flight request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await apiFetch(endpoint, {
        ...options,
        signal: controller.signal,
      });
      return res;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null; // Silently return null for aborted requests
      }
      throw err;
    }
  }, []);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return abortableFetch;
}

/**
 * Hook that manages a keyed set of abort controllers.
 * Use when you have multiple concurrent fetch contexts (e.g., different data sections).
 */
export function useAbortableRequests() {
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  const fetchWithKey = useCallback(async (key: string, endpoint: string, options: RequestInit = {}) => {
    // Cancel previous request for this key
    const existing = controllersRef.current.get(key);
    if (existing) existing.abort();

    const controller = new AbortController();
    controllersRef.current.set(key, controller);

    try {
      const res = await apiFetch(endpoint, { ...options, signal: controller.signal });
      return res;
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      throw err;
    }
  }, []);

  // Cancel all on unmount
  useEffect(() => {
    return () => {
      controllersRef.current.forEach(c => c.abort());
      controllersRef.current.clear();
    };
  }, []);

  return fetchWithKey;
}
