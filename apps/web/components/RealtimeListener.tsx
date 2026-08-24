'use client';
import { useEffect, useState, useRef } from 'react';

export default function RealtimeListener() {
  const [toast, setToast] = useState<{ title: string; message: string; show: boolean } | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function connect() {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Build full SSE URL — must be absolute for EventSource
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      let sseUrl: string;

      if (baseUrl.startsWith('http')) {
        sseUrl = `${baseUrl}/stream?token=${token}`;
      } else {
        // Relative URL — build absolute from window.location
        const origin = window.location.origin;
        const path = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
        sseUrl = `${origin}${path}/stream?token=${token}`;
      }

      // Close existing connection
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      const es = new EventSource(sseUrl);
      esRef.current = es;

      es.addEventListener('order_status_update', (e) => {
        try {
          const order = JSON.parse(e.data);
          const statusStr = order.status.replace(/_/g, ' ');
          const title = 'Order Update';
          const msg = `Your order #${order.orderNumber} is now ${statusStr}!`;

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: msg });
          }

          setToast({ title, message: msg, show: true });
          setTimeout(() => setToast(prev => (prev ? { ...prev, show: false } : null)), 6000);
        } catch {}
      });

      es.addEventListener('marketing', (e) => {
        try {
          const data = JSON.parse(e.data);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(data.title, { body: data.message });
          }
          setToast({ title: data.title, message: data.message, show: true });
          setTimeout(() => setToast(prev => (prev ? { ...prev, show: false } : null)), 8000);
        } catch {}
      });

      es.onerror = () => {
        // EventSource auto-reconnects, but if it fails completely, retry after 5s
        es.close();
        esRef.current = null;
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    connect();

    // Reconnect when user logs in (token changes)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token') connect();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!toast?.show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 bg-white shadow-2xl rounded-2xl border border-gray-100 p-4 z-[70]">
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 pt-0.5">
          <h3 className="font-bold text-gray-900 text-[14px] leading-tight">{toast.title}</h3>
          <p className="text-[13px] text-gray-600 mt-1">{toast.message}</p>
        </div>
        <button onClick={() => setToast({ ...toast, show: false })} className="text-gray-400 hover:text-gray-600 shrink-0 p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
