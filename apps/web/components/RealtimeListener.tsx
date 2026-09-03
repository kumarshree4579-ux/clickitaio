'use client';
import { useEffect, useRef } from 'react';

export default function RealtimeListener() {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let retryCount = 0;

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

      es.onopen = () => {
        retryCount = 0; // Reset backoff on successful connection
      };

      es.addEventListener('order_status_update', (e) => {
        try {
          const order = JSON.parse(e.data);
          const statusStr = order.status.replace(/_/g, ' ');
          const title = 'Order Update';
          const msg = `Your order #${order.orderNumber} is now ${statusStr}!`;

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: msg });
          }
        } catch {}
      });

      es.addEventListener('marketing', (e) => {
        try {
          const data = JSON.parse(e.data);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(data.title, { body: data.message });
          }
        } catch {}
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        
        // Exponential backoff: 5s, 10s, 20s, 40s, up to max 60s
        const backoff = Math.min(5000 * Math.pow(2, retryCount), 60000);
        retryCount++;
        reconnectTimeoutRef.current = setTimeout(connect, backoff);
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

  return null;
}
