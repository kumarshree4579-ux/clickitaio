'use client';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
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

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
    const saved = localStorage.getItem('coupon');
    if (saved) setCoupon(JSON.parse(saved));
    setMounted(true);
  }, []);

  function update(id: string, qty: number) {
    const updated = qty <= 0
      ? cart.filter(i => i._id !== id)
      : cart.map(i => i._id === id ? { ...i, qty } : i);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    syncCartToServer(updated);
    window.dispatchEvent(new Event('cart-updated'));
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError('');
    const token = localStorage.getItem('token');
    if (!token) { setCouponError('Please login to apply coupons'); setCouponLoading(false); return; }
    const res = await apiFetch('/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, cartTotal: subtotal }),
    });
    const data = await res.json();
    setCouponLoading(false);
    if (!res.ok) { setCouponError(data.error); return; }
    setCoupon(data);
    localStorage.setItem('coupon', JSON.stringify(data));
  }

  function removeCoupon() {
    setCoupon(null); setCouponCode('');
    localStorage.removeItem('coupon');
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const baseShipping = subtotal >= 500 ? 0 : 49;
  const discount = coupon?.discount || 0;
  const freeShipping = coupon?.coupon?.type === 'free_shipping';
  const shipping = freeShipping ? 0 : baseShipping;
  const total = subtotal + shipping - discount;

  if (!mounted) return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen pb-32 md:pb-8">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-3 flex gap-3 items-center mb-2.5 animate-pulse">
              <div className="w-[72px] h-[72px] bg-gray-100 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-8 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );

  if (cart.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Your cart is empty</h2>
          <p className="text-gray-400 text-sm mb-5">Looks like you haven&apos;t added anything yet</p>
          <Link href="/products"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">
            Start Shopping
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen pb-32 md:pb-8">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-6">

          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[17px] sm:text-2xl font-bold text-gray-900">
              My Cart <span className="text-gray-400 font-normal text-[14px] sm:text-base">({totalQty} item{totalQty !== 1 ? 's' : ''})</span>
            </h1>
            <button onClick={() => { setCart([]); localStorage.removeItem('cart'); syncCartToServer([]); window.dispatchEvent(new Event('cart-updated')); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">
              Clear all
            </button>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-3 gap-4">

            {/* ── Cart items — FIRST on mobile ── */}
            <div className="md:col-span-2 md:col-start-1 md:row-start-1 space-y-2.5">
              {cart.map(item => (
                <div key={item._id} className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex gap-3 items-center">

                  {/* Image — proper square */}
                  <Link href={`/products/${item._id}`} className="shrink-0">
                    <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">📦</div>}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item._id}`}>
                      <p className="font-medium text-gray-800 text-[13px] sm:text-sm leading-snug line-clamp-2 hover:text-indigo-600 transition-colors">{item.name}</p>
                    </Link>
                    <p className="text-indigo-600 font-bold text-[15px] mt-1.5">₹{fmt(item.price)}</p>

                    {/* Qty controls + total */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                        <button onClick={() => update(item._id, item.qty - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-700 font-bold text-lg active:bg-gray-200 touch-manipulation">
                          −
                        </button>
                        <span className="w-8 text-center text-[14px] font-bold text-gray-900">{item.qty}</span>
                        <button onClick={() => update(item._id, item.qty + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-700 font-bold text-lg active:bg-gray-200 touch-manipulation">
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-[14px]">₹{fmt(item.price * item.qty)}</span>
                        <button onClick={() => update(item._id, 0)}
                          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors touch-manipulation rounded-lg hover:bg-red-50">
                          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Continue shopping */}
              <Link href="/products"
                className="inline-flex items-center gap-1.5 text-[13px] text-indigo-600 hover:text-indigo-700 font-medium pt-2 px-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Continue Shopping
              </Link>
            </div>

            {/* ── Order summary — AFTER items on mobile, right column on desktop ── */}
            <div className="md:col-start-3 md:row-start-1 md:sticky md:top-20 md:self-start">
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                <h2 className="font-bold text-gray-900 text-[15px]">Order Summary</h2>

                <div className="space-y-2.5 text-[13px] text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalQty} item{totalQty !== 1 ? 's' : ''})</span>
                    <span className="font-semibold text-gray-800">₹{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-emerald-600 font-semibold' : 'text-gray-800 font-semibold'}>
                      {shipping === 0 ? 'Free' : `₹${shipping}`}
                    </span>
                  </div>
                  {subtotal < 500 && shipping > 0 && (
                    <p className="text-[12px] text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 font-medium">
                      Add ₹{fmt(500 - subtotal)} more for free shipping
                    </p>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount</span><span>-₹{fmt(discount)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon */}
                {coupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-[12px] font-bold text-emerald-700">{coupon.coupon.code}</p>
                      <p className="text-[11px] text-emerald-600">{freeShipping ? 'Free shipping applied!' : `-₹${fmt(discount)} off`}</p>
                    </div>
                    <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500 text-lg leading-none ml-2">&times;</button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] uppercase focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      />
                      <button onClick={applyCoupon} disabled={couponLoading}
                        className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-gray-700 disabled:opacity-50 shrink-0">
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-red-500 text-[12px] mt-1.5">{couponError}</p>}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                  <span className="text-[15px]">Total</span>
                  <span className="text-[18px]">₹{fmt(total)}</span>
                </div>

                {/* Desktop checkout button */}
                <Link href="/checkout"
                  className="hidden md:flex w-full bg-indigo-600 text-white text-center py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors items-center justify-center gap-2 text-[15px]">
                  Proceed to Checkout
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile sticky checkout bar ── */}
        <div className="fixed bottom-14 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="shrink-0">
            <p className="text-[11px] text-gray-400 font-medium">Total</p>
            <p className="text-[17px] font-bold text-gray-900 leading-tight">₹{fmt(total)}</p>
          </div>
          <Link href="/checkout"
            className="flex-1 bg-indigo-600 text-white text-center py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors text-[15px]">
            Checkout
          </Link>
        </div>
      </main>
    </>
  );
}
