'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Drop to A4
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrderToast, setNewOrderToast] = useState<{show: boolean, count: number}>({show: false, count: 0});
  const lastOrderCount = useRef<number | null>(null);

  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        const res = await fetch(`${API}/orders?status=received`, {
          headers: { Authorization: `Bearer ${token()}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const currentCount = Array.isArray(data) ? data.length : 0;
        
        if (lastOrderCount.current !== null && currentCount > lastOrderCount.current) {
          playNotificationSound();
          setNewOrderToast({ show: true, count: currentCount - lastOrderCount.current });
          setTimeout(() => setNewOrderToast({ show: false, count: 0 }), 5000);
        }
        lastOrderCount.current = currentCount;
      } catch (e) {}
    };

    // Initial check
    checkNewOrders();
    // Poll every 15 seconds
    const interval = setInterval(checkNewOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 relative">

      {/* New Order Toast Notification */}
      {newOrderToast.show && (
        <div className="fixed top-4 right-4 z-[100] bg-white border-l-4 border-emerald-500 shadow-lg rounded-r-lg px-4 py-3 flex items-start gap-3 animate-slide-in">
          <div className="bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">New Order Received!</h3>
            <p className="text-xs text-slate-500 mt-0.5">You have {newOrderToast.count} new order(s) to process.</p>
          </div>
          <button onClick={() => setNewOrderToast({ show: false, count: 0 })} className="text-slate-400 hover:text-slate-600 ml-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-200 lg:static lg:translate-x-0 h-full flex-shrink-0 flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">{children}</main>
      </div>
    </div>
  );
}
