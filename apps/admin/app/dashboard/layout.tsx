'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Sidebar from '../../components/Sidebar';
import PageLoader from '../../components/PageLoader';
import ImageGuidePanel from '../../components/ImageGuide';
import { apiFetch } from '../../lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

interface IncomingOrder {
  _id: string;
  orderNumber: string;
  total: number;
  items: { name: string; qty: number; price: number; image?: string }[];
  paymentMethod: string;
  address?: { name?: string; phone?: string; city?: string };
  customer?: { name?: string; email?: string };
  createdAt: string;
}

type SoundType = 'beep' | 'chime' | 'bell' | 'urgent' | 'none';

function playNotificationSound(ctxRef: React.MutableRefObject<AudioContext | null>, soundType: SoundType = 'beep', duration: number = 10) {
  if (soundType === 'none') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    if (ctxRef.current) { try { ctxRef.current.close(); } catch {} }

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    let time = ctx.currentTime;
    const endTime = ctx.currentTime + duration;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);

    if (soundType === 'beep') {
      // 3 beeps repeating pattern
      while (time < endTime) {
        for (let i = 0; i < 3 && time < endTime; i++) {
          const osc = ctx.createOscillator();
          osc.connect(gainNode);
          osc.type = 'square';
          osc.frequency.setValueAtTime(i === 1 ? 1200 : 880, time);
          gainNode.gain.setValueAtTime(0.4, time);
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
          osc.start(time);
          osc.stop(time + 0.15);
          time += 0.25;
        }
        time += 0.8;
      }
    } else if (soundType === 'chime') {
      // Gentle chime — two-tone ascending pattern
      while (time < endTime) {
        const osc1 = ctx.createOscillator();
        osc1.connect(gainNode);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523, time); // C5
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc1.start(time);
        osc1.stop(time + 0.3);

        const osc2 = ctx.createOscillator();
        osc2.connect(gainNode);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659, time + 0.2); // E5
        gainNode.gain.setValueAtTime(0.3, time + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc2.start(time + 0.2);
        osc2.stop(time + 0.5);
        time += 1.5;
      }
    } else if (soundType === 'bell') {
      // Bell ring — high frequency with decay
      while (time < endTime) {
        const osc = ctx.createOscillator();
        osc.connect(gainNode);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, time);
        osc.frequency.exponentialRampToValueAtTime(800, time + 0.5);
        gainNode.gain.setValueAtTime(0.5, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.6);
        osc.start(time);
        osc.stop(time + 0.6);
        time += 1.2;
      }
    } else if (soundType === 'urgent') {
      // Urgent alarm — fast alternating high-low
      while (time < endTime) {
        for (let i = 0; i < 6 && time < endTime; i++) {
          const osc = ctx.createOscillator();
          osc.connect(gainNode);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(i % 2 === 0 ? 1000 : 600, time);
          gainNode.gain.setValueAtTime(0.35, time);
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
          osc.start(time);
          osc.stop(time + 0.1);
          time += 0.12;
        }
        time += 0.6;
      }
    }

    setTimeout(() => { try { ctx.close(); } catch {} }, (duration + 1) * 1000);
  } catch {}
}

function stopSound(ctxRef: React.MutableRefObject<AudioContext | null>) {
  if (ctxRef.current) {
    try { ctxRef.current.close(); } catch {}
    ctxRef.current = null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<IncomingOrder[]>([]);
  const [countdown, setCountdown] = useState(10);
  const [accepting, setAccepting] = useState(false);
  const [alertSettings, setAlertSettings] = useState<{ sound: SoundType; duration: number }>({ sound: 'beep', duration: 10 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentOrder = pendingOrders[0] || null;

  // Fetch alert settings
  useEffect(() => {
    fetch(`${API}/settings/public`)
      .then(r => r.json())
      .then(data => {
        if (data?.orderAlertSound) setAlertSettings(prev => ({ ...prev, sound: data.orderAlertSound }));
        if (data?.orderAlertDuration) setAlertSettings(prev => ({ ...prev, duration: data.orderAlertDuration }));
      })
      .catch(() => {});
  }, []);


  const acceptOrder = useCallback(async (orderId: string) => {
    setAccepting(true);
    stopSound(audioCtxRef);
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted', note: 'Auto/manual accepted from dashboard' }),
      });
    } catch {}
    // Remove from queue
    setPendingOrders(prev => prev.filter(o => o._id !== orderId));
    setAccepting(false);
    setCountdown(alertSettings.duration);
    // Refresh dashboard data
    window.dispatchEvent(new CustomEvent('admin:order_status_update', { detail: { _id: orderId, status: 'accepted' } }));
  }, []);

  // Countdown timer for current order
  useEffect(() => {
    if (!currentOrder) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }

    setCountdown(alertSettings.duration);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto-accept
          acceptOrder(currentOrder._id);
          return alertSettings.duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [currentOrder?._id, acceptOrder]);

  // SSE connection
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const t = token();
    if (!t) return;

    const es = new EventSource(`${API}/stream?token=${t}`);
    
    es.addEventListener('new_order', (e) => {
      try {
        const order = JSON.parse(e.data);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Order Received!', { body: `Order #${order.orderNumber} — ₹${order.total?.toLocaleString('en-IN')}` });
        }
        window.dispatchEvent(new CustomEvent('admin:new_order', { detail: order }));
        setPendingOrders(prev => [...prev, order]);
        playNotificationSound(audioCtxRef, alertSettings.sound, alertSettings.duration);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } catch(err) {}
    });

    es.addEventListener('order_status_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent('admin:order_status_update', { detail: data }));
      } catch {}
    });

    return () => {
      es.close();
      stopSound(audioCtxRef);
    };
  }, []);

  function handleAccept() {
    if (currentOrder) acceptOrder(currentOrder._id);
  }

  function handleDismiss() {
    stopSound(audioCtxRef);
    setPendingOrders(prev => prev.slice(1));
    setCountdown(alertSettings.duration);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 relative">

      {/* Route change progress bar */}
      <PageLoader />

      {/* New Order Accept Modal */}
      {currentOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            
            {/* Timer bar */}
            <div className="h-1.5 bg-gray-100">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-linear rounded-r-full"
                style={{ width: `${(countdown / alertSettings.duration) * 100}%` }}
              />
            </div>

            {/* Header */}
            <div className="bg-emerald-50 px-5 py-4 flex items-center justify-between border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">New Order!</h3>
                  <p className="text-xs text-gray-500">#{currentOrder.orderNumber}</p>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center">
                  <span className="text-lg font-black text-emerald-600">{countdown}</span>
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5">auto-accept</span>
              </div>
            </div>

            {/* Order details */}
            <div className="px-5 py-4 space-y-3">
              {/* Customer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {(currentOrder.customer?.name || currentOrder.address?.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{currentOrder.customer?.name || currentOrder.address?.name || 'Customer'}</p>
                    <p className="text-[11px] text-gray-400">{currentOrder.address?.phone || currentOrder.customer?.email || ''}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${currentOrder.paymentMethod === 'cod' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {currentOrder.paymentMethod === 'cod' ? 'COD' : 'PAID'}
                </span>
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2 max-h-36 overflow-y-auto">
                {currentOrder.items.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 bg-white rounded px-1.5 py-0.5 border">{item.qty}x</span>
                      <span className="text-gray-700 truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800 shrink-0 ml-2">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                {currentOrder.items.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">+{currentOrder.items.length - 5} more items</p>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Order Total</span>
                <span className="text-xl font-black text-gray-900">₹{currentOrder.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
              >
                {accepting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                )}
                {accepting ? 'Accepting...' : 'Accept Order'}
              </button>
            </div>

            {/* Queue indicator */}
            {pendingOrders.length > 1 && (
              <div className="px-5 pb-3 -mt-2">
                <p className="text-[11px] text-center text-gray-400">+{pendingOrders.length - 1} more order(s) waiting</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-200 lg:static lg:translate-x-0 h-full flex-shrink-0 flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Suspense fallback={<div className="w-[304px] bg-white border-r border-gray-200 h-full shadow-sm" />}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </Suspense>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 shrink-0 gap-3 z-10">
          {/* Hamburger */}
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          {/* Image Guide Helper */}
          <ImageGuidePanel />

          {/* Admin badge */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700">Admin</p>
              <p className="text-[10px] text-slate-400">Super Admin</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
