'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const BG: Record<string, string> = {
  info: 'bg-blue-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  error: 'bg-red-600',
};

export default function NotificationBar() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API}/notifications`)
      .then(r => r.json())
      .then(d => setNotifications(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const visible = notifications.filter(n => !dismissed.has(n._id));
  if (!visible.length) return null;

  // Show only the first active notification
  const n = visible[0];

  return (
    <div className={`${BG[n.type] || BG.info} text-white text-sm py-2.5 px-4 flex items-center justify-center gap-3 relative`}>
      <span>{n.message}</span>
      {n.link && n.linkText && (
        <Link href={n.link} className="font-semibold underline underline-offset-2 hover:no-underline whitespace-nowrap">
          {n.linkText} →
        </Link>
      )}
      <button onClick={() => setDismissed(s => new Set([...s, n._id]))}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-lg leading-none">
        ×
      </button>
    </div>
  );
}
