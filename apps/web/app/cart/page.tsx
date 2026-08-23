'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import API from '../../lib/api';
import { apiFetch } from '../../lib/apiFetch';
import { syncCartToServer } from '../../lib/cart-sync';
interface CartItem { _id: string; name: string; price: number; image?: string; qty: number; }
const fmt = (n: number) => n.toLocaleString('en-IN');

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Coupon modal state
  const [showCoupons, setShowCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [fetchingCoupons, setFetchingCoupons] = useState(false);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
    const saved = localStorage.getItem('coupon');
    if (saved) setCoupon(JSON.parse(saved));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showCoupons && availableCoupons.length === 0) {
      setFetchingCoupons(true);
      apiFetch('/coupons/available')
        .then(res => res.ok ? res.json() : [])
        .then(data => setAvailableCoupons(Array.isArray(data) ? data : []))
        .catch(() => setAvailableCoupons([]))
        .finally(() => setFetchingCoupons(false));
    }
  }, [showCoupons]);

  function update(id: string, qty: number) {
    const updated = qty <= 0
      ? cart.filter(i => i._id !== id)
      : cart.map(i => i._id === id ? { ...i, qty } : i);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    syncCartToServer(updated);
    window.dispatchEvent(new Event('cart-updated'));
  }

  async function applyCoupon(code: string) {
    if (!code.trim()) return;
    setCouponLoading(true); setCouponError('');
    const token = localStorage.getItem('token');
    if (!token) { setCouponError('Please login to apply coupons'); setCouponLoading(false); return; }
    const res = await apiFetch('/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, cartTotal: subtotal }),
    });
    const data = await res.json();
    setCouponLoading(false);
    if (!res.ok) { setCouponError(data.error); return; }
    setCoupon(data);
    localStorage.setItem('coupon', JSON.stringify(data));
    setShowCoupons(false);
  }

  function removeCoupon() {
    setCoupon(null); setCouponCode('');
    localStorage.removeItem('coupon');
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const baseShipping = subtotal >= 500 ? 0 : 49; // Simplified for now
  const discount = coupon?.discount || 0;
  const freeShipping = coupon?.coupon?.type === 'free_shipping';
  const shipping = freeShipping ? 0 : baseShipping;
  const total = subtotal + shipping - discount;

  if (!mounted) return (
    <main className="bg-gray-50 min-h-screen pb-32">
      <div className="h-14 bg-white border-b border-gray-100 flex items-center px-4 mb-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse" /></div>
      <div className="max-w-2xl mx-auto px-4 space-y-4">
        <div className="bg-white rounded-2xl h-[35vh] animate-pulse" />
        <div className="bg-white rounded-2xl h-40 animate-pulse" />
      </div>
    </main>
  );

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col pb-16">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-4 sm:px-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">My Cart </h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Your cart is empty</h2>
          <p className="text-gray-400 text-sm mb-5">Looks like you haven&apos;t added anything yet</p>
          <Link href="/products" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">Start Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="max-w-2xl mx-auto bg-gray-50 min-h-screen pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pb-24">
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">My Cart <span className="text-gray-400 font-normal text-[14px]">({totalQty})</span></h1>
          </div>
          <button onClick={() => { setCart([]); localStorage.removeItem('cart'); syncCartToServer([]); window.dispatchEvent(new Event('cart-updated')); }}
            className="text-xs text-rose-500 bg-rose-50 px-2.5 py-1.5 rounded-lg hover:bg-rose-100 transition-colors font-bold">Clear all</button>
        </div>

        <div className="p-3 sm:p-3 space-y-4">
          {/* Cart Items — 40vh scrollable */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden flex flex-col">
            <div className="px-4 py-0 border-b border-gray-50 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 text-[14px]">Review Items</h2>
            </div>
            <div className="max-h-[35vh] overflow-y-auto custom-scrollbar p-3 space-y-3">
              {cart.map(item => (
                <div key={item._id} className="flex gap-3.5 items-start">
                  <Link href={`/products/${item._id}`} className="shrink-0 relative overflow-hidden rounded-xl border border-gray-100">
                    <div className="w-[72px] h-[72px] bg-gray-50 flex items-center justify-center">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="text-2xl">📦</div>}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0 py-0.5">
                    <Link href={`/products/${item._id}`} className="block">
                      <p className="font-semibold text-gray-800 text-[14px] leading-snug line-clamp-2">{item.name}</p>
                    </Link>
                    <p className="text-gray-900 font-extrabold text-[15px] mt-1.5">₹{fmt(item.price)}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2 pt-1">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <button onClick={() => update(item._id, item.qty - 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 font-bold active:scale-95 text-lg leading-none">−</button>
                      <span className="w-7 text-center text-[13px] font-bold text-gray-900">{item.qty}</span>
                      <button onClick={() => update(item._id, item.qty + 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 font-bold active:scale-95 text-lg leading-none">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 bg-gray-50/50 border-t border-gray-50">
              <Link href="/products" className="inline-flex items-center gap-1.5 text-[13px] text-indigo-600 font-bold py-1 px-1 hover:text-indigo-700">
                + Add more items
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 py-0 ">
            <h2 className="font-bold text-gray-900 text-[15px] mb-2">Order Summary</h2>

            <div className="space-y-2.5 text-[13px] text-gray-600">
              <div className="flex justify-between items-center">
                <span>SubTotal (Total MRP)</span>
                <span className="font-semibold text-gray-800">₹{fmt(subtotal)}</span>
              </div>

              {/* Coupon Button (Zomato Style) */}
              <button onClick={() => setShowCoupons(true)} className="w-full flex items-center justify-between bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 border-dashed rounded-xl p-3 my-3 transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-lg">🎟️</div>
                  <div>
                    <p className="font-bold text-indigo-700 text-[14px]">{coupon ? coupon.coupon.code : 'Apply Coupon'}</p>
                    <p className="text-[11px] text-indigo-600/80 font-medium">{coupon ? 'Coupon applied successfully' : 'View all available offers'}</p>
                  </div>
                </div>
                <div className="text-indigo-500">
                  {coupon ? (
                    <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeCoupon(); }} className="p-1 text-lg font-bold hover:text-indigo-700">&times;</span>
                  ) : (
                    <span className="font-bold text-lg leading-none group-hover:translate-x-1 transition-transform inline-block">›</span>
                  )}
                </div>
              </button>

              {discount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-semibold">
                  <span>Discount (Coupon)</span><span>-₹{fmt(discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Delivery Charge</span>
                <span className={shipping === 0 ? 'text-emerald-600 font-semibold text-[12px] uppercase tracking-wide' : 'text-gray-800 font-semibold'}>
                  {shipping === 0 ? 'Free' : `₹${shipping}`}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between font-extrabold text-gray-900">
              <span className="text-[15px]">Total Payable Amount</span>
              <span className="text-[18px]">₹{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Bottom checkout bar */}
        <div className="fixed bottom-14 sm:bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 my-3 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="shrink-0 flex flex-col justify-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">To Pay</span>
              <span className="text-[18px] font-black text-gray-900 leading-none">₹{fmt(total)}</span>
            </div>
            <Link href="/checkout"
              className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200/50 flex items-center justify-center gap-2 text-[15px]">
              Proceed to Checkout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </main>

      {/* Coupon Bottom Sheet */}
      {showCoupons && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCoupons(false)} />
          <div className="relative bg-white rounded-t-3xl h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom max-w-2xl mx-auto w-full">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white rounded-t-3xl">
              <h3 className="font-bold text-lg text-gray-900">Select Coupon</h3>
              <button onClick={() => setShowCoupons(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 font-bold text-lg leading-none transition-colors">&times;</button>
            </div>

            <div className="p-4 border-b border-gray-100 shrink-0 bg-white">
              <div className="flex gap-2">
                <input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon(couponCode)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] uppercase focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 font-bold tracking-wide transition-all"
                />
                <button onClick={() => applyCoupon(couponCode)} disabled={couponLoading || !couponCode.trim()}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[14px] font-bold hover:bg-gray-800 disabled:opacity-50 shrink-0 transition-colors">
                  {couponLoading ? '...' : 'APPLY'}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-[12px] mt-2 font-medium">{couponError}</p>}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-gray-50">
              {fetchingCoupons ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : availableCoupons.length > 0 ? (
                availableCoupons.map((c) => {
                  const meetsMinOrder = subtotal >= c.minOrderAmount;
                  return (
                    <div key={c._id} className={`bg-white border ${meetsMinOrder ? 'border-indigo-100 shadow-sm' : 'border-gray-200 opacity-60'} rounded-2xl p-4 flex flex-col transition-all`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-lg">🎟️</span>
                          <span className="font-black text-gray-900 text-lg uppercase tracking-wider">{c.code}</span>
                        </div>
                        {meetsMinOrder ? (
                          <button onClick={() => applyCoupon(c.code)} disabled={couponLoading} className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-1.5 rounded-lg hover:bg-indigo-100 active:scale-95 transition-all">APPLY</button>
                        ) : (
                          <span className="text-gray-400 text-[11px] font-bold bg-gray-100 px-3 py-1 rounded-md uppercase tracking-wider">Locked</span>
                        )}
                      </div>
                      <p className="text-[13px] font-medium text-gray-800">{c.description || 'Special offer!'}</p>
                      {!meetsMinOrder && (
                        <p className="text-[12px] text-red-500 font-medium mt-2 bg-red-50 p-2 rounded-lg">Add ₹{fmt(c.minOrderAmount - subtotal)} more to unlock this coupon</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-gray-500 font-medium text-sm">No coupons available at the moment.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
