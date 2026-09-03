'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { apiFetch } from '../../lib/apiFetch';
import { syncCartToServer } from '../../lib/cart-sync';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
}

interface Coupon {
  _id?: string;
  code: string;
  description?: string;
  minOrderAmount?: number;
  type?: string;
}

interface AppliedCoupon {
  discount: number;
  coupon: Coupon;
}

const fmt = (n: number) =>
  Math.max(0, Math.round(n)).toLocaleString('en-IN');

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [showCoupons, setShowCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [fetchingCoupons, setFetchingCoupons] = useState(false);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem('cart') || '[]'
      );

      setCart(Array.isArray(savedCart) ? savedCart : []);

      const savedCoupon = localStorage.getItem('coupon');

      if (savedCoupon) {
        try {
          setCoupon(JSON.parse(savedCoupon));
        } catch {
          localStorage.removeItem('coupon');
        }
      }
    } catch {
      setCart([]);
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showCoupons || availableCoupons.length > 0) return;

    let cancelled = false;

    setFetchingCoupons(true);

    apiFetch('/coupons/available')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) {
          setAvailableCoupons(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableCoupons([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFetchingCoupons(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showCoupons, availableCoupons.length]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
        0
      ),
    [cart]
  );

  const totalQty = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.qty || 0),
        0
      ),
    [cart]
  );

  const discount = Math.min(
    Math.max(Number(coupon?.discount || 0), 0),
    subtotal
  );

  const baseShipping = subtotal >= 500 || subtotal === 0 ? 0 : 49;

  const freeShipping =
    coupon?.coupon?.type === 'free_shipping';

  const shipping = freeShipping ? 0 : baseShipping;

  const total = Math.max(
    0,
    subtotal + shipping - discount
  );

  function update(id: string, qty: number) {
    const updated =
      qty <= 0
        ? cart.filter((item) => item._id !== id)
        : cart.map((item) =>
            item._id === id
              ? { ...item, qty }
              : item
          );

    setCart(updated);

    localStorage.setItem(
      'cart',
      JSON.stringify(updated)
    );

    syncCartToServer(updated);

    window.dispatchEvent(
      new Event('cart-updated')
    );
  }

  function clearCart() {
    setCart([]);

    localStorage.removeItem('cart');

    syncCartToServer([]);

    window.dispatchEvent(
      new Event('cart-updated')
    );
  }

  async function applyCoupon(code: string) {
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) return;

    setCouponLoading(true);
    setCouponError('');

    const token = localStorage.getItem('token');

    if (!token) {
      setCouponError(
        'Please login to apply coupons'
      );
      setCouponLoading(false);
      return;
    }

    try {
      const res = await apiFetch(
        '/coupons/validate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: cleanCode,
            cartTotal: subtotal,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setCouponError(
          data?.error ||
            'Unable to apply this coupon'
        );
        return;
      }

      setCoupon(data);

      localStorage.setItem(
        'coupon',
        JSON.stringify(data)
      );

      setCouponCode('');
      setShowCoupons(false);
    } catch {
      setCouponError(
        'Something went wrong. Please try again.'
      );
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponCode('');
    setCouponError('');

    localStorage.removeItem('coupon');
  }

  function openCouponSheet() {
    setCouponError('');
    setShowCoupons(true);
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="h-14 bg-white border-b border-gray-100 flex items-center px-4">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
            <div className="bg-white rounded-2xl h-[360px] animate-pulse" />
            <div className="bg-white rounded-2xl h-[320px] animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-40 h-14 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 shadow-sm">
          <h1 className="text-[17px] font-bold text-gray-900">
            My Cart
          </h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center pb-16">
          <div className="w-18 h-18 sm:w-20 sm:h-20 bg-primary-light rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-9 h-9 sm:w-10 sm:h-10 text-indigo-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-gray-800 mb-1">
            Your cart is empty
          </h2>

          <p className="text-gray-400 text-sm mb-5">
            Looks like you haven&apos;t added anything yet
          </p>

          <Link
            href="/products"
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors text-sm"
          >
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pb-8">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="h-14 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/"
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 -ml-1"
                  aria-label="Go back"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </Link>

                <h1 className="text-[16px] sm:text-[18px] font-bold text-gray-900 tracking-tight">
                  My Cart{' '}
                  <span className="text-gray-400 font-normal text-[13px] sm:text-[14px]">
                    ({totalQty})
                  </span>
                </h1>
              </div>

              <button
                onClick={clearCart}
                className="text-[11px] sm:text-xs text-rose-500 bg-rose-50 px-2.5 py-1.5 rounded-lg hover:bg-rose-100 transition-colors font-bold"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] gap-4 lg:gap-6 items-start">
            {/* LEFT — CART */}
            <section className="min-w-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-800 text-[13px] sm:text-[14px]">
                      Review Items
                    </h2>

                    <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                      {totalQty} item
                      {totalQty !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <Link
                    href="/products"
                    className="text-[12px] sm:text-[13px] text-primary font-bold hover:text-primary-dark"
                  >
                    + Add items
                  </Link>
                </div>

                <div className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className="flex gap-2.5 sm:gap-4 items-center"
                    >
                      {/* Product Image */}
                      <Link
                        href={`/products/${item._id}`}
                        className="shrink-0 relative overflow-hidden rounded-xl border border-gray-100"
                      >
                        <div className="w-[62px] h-[62px] sm:w-[76px] sm:h-[76px] lg:w-[82px] lg:h-[82px] bg-gray-50 flex items-center justify-center">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-xl sm:text-2xl">
                              📦
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item._id}`}
                          className="block"
                        >
                          <p className="font-semibold text-gray-800 text-[13px] sm:text-[14px] lg:text-[15px] leading-snug line-clamp-2">
                            {item.name}
                          </p>
                        </Link>

                        <p className="text-gray-900 font-extrabold text-[14px] sm:text-[15px] mt-1">
                          ₹{fmt(item.price)}
                        </p>
                      </div>

                      {/* Quantity */}
                      <div className="shrink-0">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          <button
                            onClick={() =>
                              update(
                                item._id,
                                item.qty - 1
                              )
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 font-bold active:scale-95 text-base sm:text-lg leading-none"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <span className="w-7 sm:w-8 text-center text-[12px] sm:text-[13px] font-bold text-gray-900">
                            {item.qty}
                          </span>

                          <button
                            onClick={() =>
                              update(
                                item._id,
                                item.qty + 1
                              )
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 font-bold active:scale-95 text-base sm:text-lg leading-none"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-t border-gray-50">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] text-primary font-bold hover:text-primary-dark"
                  >
                    ← Continue shopping
                  </Link>
                </div>
              </div>
            </section>

            {/* RIGHT — SUMMARY */}
            <aside className="lg:sticky lg:top-[76px]">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <h2 className="font-bold text-gray-900 text-[15px] sm:text-[16px] mb-3 sm:mb-4">
                    Order Summary
                  </h2>

                  <div className="space-y-2.5 text-[12px] sm:text-[13px] text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>
                        SubTotal (Total MRP)
                      </span>

                      <span className="font-semibold text-gray-800">
                        ₹{fmt(subtotal)}
                      </span>
                    </div>

                    {/* Coupon */}
                    <button
                      onClick={openCouponSheet}
                      className="w-full flex items-center justify-between bg-primary-light/50 hover:bg-primary-light border border-primary-light border-dashed rounded-xl p-2.5 sm:p-3 my-3 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary-light text-primary rounded-lg flex items-center justify-center text-base">
                          🎟️
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-primary-dark text-[13px] sm:text-[14px] truncate max-w-[200px]">
                            {coupon
                              ? coupon.coupon.code
                              : 'Apply Coupon'}
                          </p>

                          <p className="text-[10px] sm:text-[11px] text-primary/80 font-medium">
                            {coupon
                              ? 'Coupon applied successfully'
                              : 'View available offers'}
                          </p>
                        </div>
                      </div>

                      <div className="text-primary shrink-0">
                        {coupon ? (
                          <span
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeCoupon();
                            }}
                            className="p-1 text-lg font-bold hover:text-primary-dark"
                            role="button"
                            aria-label="Remove coupon"
                          >
                            &times;
                          </span>
                        ) : (
                          <span className="font-bold text-lg leading-none group-hover:translate-x-1 transition-transform inline-block">
                            ›
                          </span>
                        )}
                      </div>
                    </button>

                    {discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 font-semibold">
                        <span>
                          Discount (Coupon)
                        </span>

                        <span>
                          -₹{fmt(discount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span>Delivery Charge</span>

                      <span
                        className={
                          shipping === 0
                            ? 'text-emerald-600 font-semibold text-[11px] uppercase tracking-wide'
                            : 'text-gray-800 font-semibold'
                        }
                      >
                        {shipping === 0
                          ? 'Free'
                          : `₹${shipping}`}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3.5 mt-4 flex justify-between items-center font-extrabold text-gray-900">
                    <span className="text-[14px] sm:text-[15px]">
                      Total Payable
                    </span>

                    <span className="text-[18px] sm:text-[20px]">
                      ₹{fmt(total)}
                    </span>
                  </div>

                  {subtotal < 500 && (
                    <div className="mt-3 rounded-lg bg-amber-50 text-amber-700 px-3 py-2  text-[11px] sm:text-xs">
                      Add ₹{fmt(500 - subtotal)} more
                      to get free delivery.
                    </div>
                  )}

                  {/* Desktop Checkout */}
                  <Link
                    href="/checkout"
                    className="hidden  lg:flex mt-4 w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary-dark active:scale-[0.98] transition-all shadow-md shadow-indigo-200/50 items-center justify-center gap-2 text-[14px]"
                  >
                    Proceed to Checkout

                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>

                  <p className="hidden lg:block text-center text-[10px] text-gray-400 mt-3">
                    Secure checkout • Fast delivery
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* MOBILE CHECKOUT BAR */}
      <div className="lg:hidden fixed bottom-15 left-0 right-0 z-40 bg-white border-t border-gray-200 px-3 sm:px-4 py-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="shrink-0 flex flex-col justify-center min-w-[76px]">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
              To Pay
            </span>

            <span className="text-[17px] font-black text-gray-900 leading-none">
              ₹{fmt(total)}
            </span>
          </div>

          <Link
            href="/checkout"
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark active:scale-[0.98] transition-all shadow-md shadow-indigo-200/50 flex items-center justify-center gap-2 text-[14px]"
          >
            Proceed to Checkout

            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* COUPON BOTTOM SHEET */}
      {showCoupons && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCoupons(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl h-[78vh] sm:h-[70vh] lg:h-auto lg:max-h-[720px] lg:w-[560px] lg:mx-auto lg:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3.5 sm:p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="font-bold text-base sm:text-lg text-gray-900">
                Select Coupon
              </h3>

              <button
                onClick={() => setShowCoupons(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 font-bold text-lg leading-none transition-colors"
                aria-label="Close coupons"
              >
                &times;
              </button>
            </div>

            {/* Manual Coupon */}
            <div className="p-3.5 sm:p-4 border-b border-gray-100 shrink-0 bg-white">
              <div className="flex gap-2">
                <input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) =>
                    setCouponCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyCoupon(couponCode);
                    }
                  }}
                  className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-[13px] sm:text-[14px] uppercase focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 font-bold tracking-wide transition-all"
                />

                <button
                  onClick={() =>
                    applyCoupon(couponCode)
                  }
                  disabled={
                    couponLoading ||
                    !couponCode.trim()
                  }
                  className="bg-gray-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[12px] sm:text-[14px] font-bold hover:bg-gray-800 disabled:opacity-50 shrink-0 transition-colors"
                >
                  {couponLoading
                    ? '...'
                    : 'APPLY'}
                </button>
              </div>

              {couponError && (
                <p className="text-red-500 text-[11px] sm:text-[12px] mt-2 font-medium">
                  {couponError}
                </p>
              )}
            </div>

            {/* Coupon List */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 bg-gray-50">
              {fetchingCoupons ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableCoupons.length > 0 ? (
                availableCoupons.map((c) => {
                  const minOrder =
                    Number(c.minOrderAmount || 0);

                  const meetsMinOrder =
                    subtotal >= minOrder;

                  return (
                    <div
                      key={c._id || c.code}
                      className={`bg-white border ${
                        meetsMinOrder
                          ? 'border-primary-light shadow-sm'
                          : 'border-gray-200 opacity-60'
                      } rounded-2xl p-3.5 sm:p-4 transition-all`}
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-8 h-8 shrink-0 bg-primary-light text-primary rounded-lg flex items-center justify-center text-base">
                            🎟️
                          </span>

                          <span className="font-black text-gray-900 text-base sm:text-lg uppercase tracking-wider truncate">
                            {c.code}
                          </span>
                        </div>

                        {meetsMinOrder ? (
                          <button
                            onClick={() =>
                              applyCoupon(c.code)
                            }
                            disabled={couponLoading}
                            className="text-primary font-bold text-[12px] sm:text-sm bg-primary-light px-3 sm:px-4 py-1.5 rounded-lg hover:bg-primary-light active:scale-95 transition-all shrink-0"
                          >
                            APPLY
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px] sm:text-[11px] font-bold bg-gray-100 px-2.5 sm:px-3 py-1 rounded-md uppercase tracking-wider shrink-0">
                            Locked
                          </span>
                        )}
                      </div>

                      <p className="text-[12px] sm:text-[13px] font-medium text-gray-800">
                        {c.description ||
                          'Special offer!'}
                      </p>

                      {!meetsMinOrder && (
                        <p className="text-[11px] sm:text-[12px] text-red-500 font-medium mt-2 bg-red-50 p-2 rounded-lg">
                          Add ₹
                          {fmt(
                            minOrder - subtotal
                          )}{' '}
                          more to unlock this coupon
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-gray-500 font-medium text-sm">
                  No coupons available at the moment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
