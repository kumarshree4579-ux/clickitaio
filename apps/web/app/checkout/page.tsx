'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import DeliveryMap from '../../components/DeliveryMap';

import API from '../../lib/api';
import { apiFetch } from '../../lib/apiFetch';

interface CartItem { _id: string; name: string; price: number; image?: string; qty: number; }
interface Address { _id?: string; name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; country: string; location?: { lat: number; lng: number } }

const emptyAddress: Address = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' };
const fmt = (n: number) => n.toLocaleString('en-IN');

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
  const [newAddr, setNewAddr] = useState<Address>(emptyAddress);
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [bookingForOther, setBookingForOther] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [coupon, setCoupon] = useState<any>(null);

  const token = () => localStorage.getItem('token');

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(c);
    if (!c.length) router.push('/cart');
    const user = localStorage.getItem('user');
    if (!user) { router.push('/login'); return; }

    const parsedUser = JSON.parse(user);
    setCurrentUser(parsedUser);
    setNewAddr(prev => ({
      ...prev,
      name: parsedUser.name || '',
      phone: parsedUser.mobile || ''
    }));

    const saved = localStorage.getItem('coupon');
    if (saved) setCoupon(JSON.parse(saved));
    apiFetch('/addresses')
      .then(async r => {
        if (!r.ok) {
          throw new Error('Failed to fetch addresses');
        }
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAddresses(data);
          if (data.length) setSelectedAddr(data.find((a: any) => a.isDefault) || data[0]);
          else setShowNewAddr(true);
        } else {
          setAddresses([]);
          setShowNewAddr(true);
        }
      }).catch(() => {
        setAddresses([]);
        setShowNewAddr(true);
      });
    fetch(`${API}/settings/public`).then(r => r.json()).then(setStoreSettings).catch(() => { });
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = coupon?.discount || 0;
  const freeShipping = coupon?.coupon?.type === 'free_shipping';
  const baseShipping = storeSettings
    ? (subtotal >= storeSettings.freeDeliveryAbove ? 0 : storeSettings.deliveryCharge)
    : (subtotal >= 500 ? 0 : 49);
  const shipping = freeShipping ? 0 : baseShipping;
  const total = subtotal + shipping - discount;

  async function saveNewAddress() {
    if (!newAddr.location) {
      alert('Please select a map location before saving your address.');
      return;
    }
    const isEdit = !!newAddr._id;
    const res = await apiFetch(isEdit ? `/addresses/${newAddr._id}` : '/addresses', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAddr),
    });
    const saved = await res.json();
    if (!res.ok) {
      alert(saved.error || 'Failed to save address');
      return;
    }
    if (isEdit) {
      setAddresses(a => a.map(addr => addr._id === saved._id ? saved : addr));
    } else {
      setAddresses(a => [...a, saved]);
    }
    setSelectedAddr(saved);
    setShowNewAddr(false);
    setNewAddr(emptyAddress);
  }

  function handleMapConfirm(result: any) {
    setShowMap(false);
    setNewAddr(prev => ({
      ...prev,
      ...(result.addressData || {}),
      location: { lat: result.lat, lng: result.lng }
    }));
    setShowNewAddr(true);
  }

  async function placeOrder() {
    if (!selectedAddr) {
      setError('Please select or add a delivery address.');
      return;
    }
    if (storeSettings?.hasZones && !selectedAddr.location) {
      setError('The selected address does not have a map location. Please add a new address with a map location.');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await apiFetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart, address: selectedAddr, paymentMethod,
          couponCode: coupon?.coupon?.code,
          deliveryLocation: selectedAddr.location,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to place order'); setLoading(false); return; }

      if (paymentMethod === 'cod') {
        localStorage.removeItem('cart');
        localStorage.removeItem('coupon');
        window.dispatchEvent(new Event('cart-updated'));
        router.push(`/orders/${data.order._id}?success=1`);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        const options = {
          key: data.razorpayKeyId,
          amount: total * 100,
          currency: 'INR',
          name: 'Ecom Store',
          order_id: data.razorpayOrderId,
          handler: async (response: any) => {
            const verifyRes = await apiFetch('/orders/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.order._id,
                razorpayOrderId: data.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            if (verifyRes.ok) {
              localStorage.removeItem('cart');
              localStorage.removeItem('coupon');
              window.dispatchEvent(new Event('cart-updated'));
              router.push(`/orders/${data.order._id}?success=1`);
            } else {
              setError('Payment verification failed');
            }
          },
          prefill: { name: selectedAddr.name, contact: selectedAddr.phone },
          theme: { color: '#4f46e5' },
        };
        // @ts-ignore
        new window.Razorpay(options).open();
      };
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      {showMap && <DeliveryMap onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} />}

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 md:py-8 pb-44 md:pb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 hidden md:block">Checkout</h1>
        {error && <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl shadow-sm flex items-center gap-2"><svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-xs sm:text-sm">{error}</span></div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-2 space-y-3 md:space-y-6">



            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs sm:text-sm">📍</div>
                  Delivery Address
                </h2>
                {addresses.length > 0 && !showNewAddr && (
                  <button onClick={() => setShowNewAddr(true)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    + Add New
                  </button>
                )}
              </div>

              {!showNewAddr && (
                <div className="space-y-2.5 sm:space-y-3 mb-2">
                  {addresses.map((a: any, idx: number) => (
                    <label key={a._id || idx} className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-2xl cursor-pointer transition-all ${selectedAddr?._id === a._id ? 'border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500 ring-opacity-20' : 'hover:border-gray-300 hover:bg-gray-50'}`}>
                      <input type="radio" name="address" checked={selectedAddr?._id === a._id} onChange={() => setSelectedAddr(a)} className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer" />
                      <div className="text-sm flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-800">{a.name} <span className="text-gray-400 font-normal mx-1">•</span> {a.phone}</p>
                          <div className="flex items-center gap-2">
                            {a.isDefault && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">DEFAULT</span>}
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewAddr(a); setShowNewAddr(true); }}
                              className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                              title="Edit Address"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{a.line1}{a.line2 ? `, ${a.line2}` : ''} <br /> {a.city}, {a.state} - <span className="font-medium text-gray-700">{a.pincode}</span></p>
                      </div>
                    </label>
                  ))}
                  {addresses.length === 0 && <p className="text-sm text-gray-500 italic">No addresses saved yet.</p>}
                </div>
              )}

              {showNewAddr && (
                <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-indigo-500">{newAddr._id ? '✎' : '+'}</span> {newAddr._id ? 'Edit Address' : 'Enter New Address'}
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={bookingForOther} onChange={e => {
                        setBookingForOther(e.target.checked);
                        if (e.target.checked) {
                          setNewAddr(a => ({ ...a, name: '', phone: '' }));
                        } else if (currentUser) {
                          setNewAddr(a => ({ ...a, name: currentUser.name || '', phone: currentUser.mobile || '' }));
                        }
                      }} className="w-3.5 h-3.5 accent-indigo-600 rounded" />
                      Booking for someone else?
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-2">
                      {newAddr.location ? (
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <span className="text-xl">📍</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-emerald-800">Map location selected</p>
                          </div>
                          <button onClick={() => setShowMap(true)} className="text-xs text-indigo-600 font-medium hover:underline">Change</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowMap(true)} className="w-full flex items-center justify-between border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl p-3 text-left transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-lg text-indigo-500">📍</div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Drop pin on map</p>
                              <p className="text-[10px] text-red-400 font-bold">Required for accurate delivery</p>
                            </div>
                          </div>
                          <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1.5 rounded-lg font-bold">Select</span>
                        </button>
                      )}
                    </div>
                    {(['name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'] as const).map(f => (
                      <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={newAddr[f] || ''}
                        onChange={e => setNewAddr(a => ({ ...a, [f]: e.target.value }))}
                        className={`border-gray-200 border rounded-xl px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white shadow-sm transition-shadow ${f === 'line1' ? 'sm:col-span-2' : ''}`} />
                    ))}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveNewAddress} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors w-full sm:w-auto">
                      Save Address
                    </button>
                    {addresses.length > 0 && (
                      <button onClick={() => { setShowNewAddr(false); setNewAddr(emptyAddress); }} className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xs sm:text-sm">💳</div>
                Payment Method
              </h2>
              <div className="space-y-2.5 sm:space-y-3">
                {[
                  { value: 'razorpay', label: '💳 Pay Online (Razorpay)', sub: 'UPI, Cards, Net Banking, Wallets' },
                  { value: 'cod', label: '💵 Cash on Delivery', sub: 'Pay when your order arrives' },
                ].map(opt => (
                  <label key={opt.value} className={`flex gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === opt.value ? 'border-indigo-400 bg-indigo-50' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value as any)} className="mt-1 accent-indigo-600" />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 sticky top-24 shadow-sm">
              <h2 className="font-bold text-gray-900 text-lg">Order Summary</h2>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item, idx) => (
                  <div key={item._id || idx} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate flex-1 mr-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-100 rounded text-[10px] flex items-center justify-center font-bold text-gray-500">{item.qty}x</div>
                      {item.name}
                    </span>
                    <span className="font-semibold text-gray-900">₹{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-medium text-gray-900">₹{fmt(subtotal)}</span></div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className={shipping === 0 ? 'text-emerald-600 font-bold tracking-wide uppercase text-xs mt-0.5' : 'font-medium text-gray-900'}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                {discount > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Coupon Discount</span><span>-₹{fmt(discount)}</span></div>}
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="font-bold text-gray-900">To Pay</span>
                <span className="font-black text-xl text-gray-900">₹{fmt(total)}</span>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}
              {/* Desktop Place Order Button */}
              <button onClick={placeOrder} disabled={loading}
                className="hidden md:flex w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-transform active:scale-95 items-center justify-center gap-2 shadow-sm">
                {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : `Pay ₹${fmt(total)}`}
                {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Bar */}
      {!showNewAddr && (
        <div className="md:hidden fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 px-3 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-40">
          {error && (
            <div className="mb-2.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-red-100 flex items-center justify-center gap-1.5 transition-all">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="shrink-0">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Total</p>
              <p className="text-lg font-black text-gray-900">₹{fmt(total)}</p>
            </div>
            <button onClick={placeOrder} disabled={loading || !selectedAddr}
              className="flex-1 bg-indigo-600 text-white py-3 px-5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
              {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : 'Proceed to Pay'}
              {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
