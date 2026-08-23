'use client';
import { useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

type SSEEventHandler = (data: any) => void;

/**
 * Hook that connects to the admin SSE stream and dispatches custom
 * window events so any component can react to real-time updates.
 * 
 * Also accepts optional direct event handlers for convenience.
 */
export function useAdminSSE(handlers?: Record<string, SSEEventHandler>) {
  const esRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || !API) return;

    const es = new EventSource(`${API}/stream?token=${token}`);
    esRef.current = es;

    es.addEventListener('new_order', (e) => {
      try {
        const data = JSON.parse(e.data);
        // Dispatch a global event so the dashboard can react
        window.dispatchEvent(new CustomEvent('admin:new_order', { detail: data }));
        handlersRef.current?.['new_order']?.(data);
      } catch {}
    });

    es.addEventListener('order_status_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent('admin:order_status_update', { detail: data }));
        handlersRef.current?.['order_status_update']?.(data);
      } catch {}
    });

    es.onerror = () => {
      // EventSource auto-reconnects, no action needed
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);
}
