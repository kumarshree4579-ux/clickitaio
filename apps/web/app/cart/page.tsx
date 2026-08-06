'use client';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;
interface CartItem { _id: string; name: string; price: number; image?: string; qty: number; }

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
    const saved = localStorage.getItem('coupon');
    if (saved) setCoupon(JSON.parse(saved));
  }, []);

  function update(id: string, qty: number) {
    const updated = qty <= 0 ? cart.filter(i => i._id !== id) : cart.map(i => i._id === id ? { ...i, qty } : i);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError('');
    const token = localStorage.getItem('token');
    if (!token) { setCouponError('Please login to apply coupons'); setCouponLoading(false); return; }
    const res = await fetch(`${API}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
  const shipping = subtotal >= 500 ? 0 : 49;
  const discount = coupon?.discount || 0;
  const total = subtotal + shipping - discount;

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Cart</h1>
        {cart.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🛒</p>
            <p className="mb-4">Your cart is empty</p>
            <Link href="/products" className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700">Shop Now</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              {cart.map(item => (
                <div key={item._id} className="bg-white rounded-xl p-4 shadow-sm flex gap-4 items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                    <p className="text-blue-600 font-bold">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => update(item._id, item.qty - 1)} className="w-7 h-7 border rounded-full text-gray-600 hover:bg-gray-100">−</button>
                    <span className="w-6 text-center text-sm">{item.qty}</span>
                    <button onClick={() => update(item._id, item.qty + 1)} className="w-7 h-7 border rounded-full text-gray-600 hover:bg-gray-100">+</button>
                  </div>
                  <p className="font-bold text-gray-800 w-16 text-right">₹{item.price * item.qty}</p>
                  <button onClick={() => update(item._id, 0)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm h-fit space-y-3">
              <h2 className="font-bold text-gray-800">Order Summary</h2>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>

              {coupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-green-700">{coupon.coupon.code} applied</p>
                    <p className="text-xs text-green-600">-₹{discount} discount</p>
                  </div>
                  <button onClick={removeCoupon} className="text-red-400 hover:text-red-600">×</button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input placeholder="Coupon code" value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm uppercase" />
                    <button onClick={applyCoupon} disabled={couponLoading}
                      className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs">{couponError}</p>}
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>-₹{discount}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-gray-800">
                <span>Total</span><span>₹{total}</span>
              </div>
              <Link href="/checkout" className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
