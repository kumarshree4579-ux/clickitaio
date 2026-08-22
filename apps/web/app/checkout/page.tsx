'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import DeliveryMap from '../../components/DeliveryMap';

import API from '../../lib/api';

interface CartItem { _id: string; name: string; price: number; image?: string; qty: number; }
interface Address { _id?: string; name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; country: string; }

const emptyAddress: Address = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' };
const fmt = (n: number) => n.toLocaleString('en-IN');

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
  const [newAddr, setNewAddr] = useState<Address>(emptyAddress);
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryEta, setDeliveryEta] = useState('');
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [coupon, setCoupon] = useState<any>(null);

  const token = () => localStorage.getItem('token');

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(c);
    if (!c.length) router.push('/cart');
    const user = localStorage.getItem('user');
    if (!user) { router.push('/login'); return; }
    const saved = localStorage.getItem('coupon');
    if (saved) setCoupon(JSON.parse(saved));
    fetch(`${API}/addresses`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(data => {
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
    fetch(`${API}/settings/public`).then(r => r.json()).then(setStoreSettings).catch(() => {});
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
    const res = await fetch(`${API}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(newAddr),
    });
    const saved = await res.json();
    setAddresses(a => [...a, saved]);
    setSelectedAddr(saved);
    setShowNewAddr(false);
    setNewAddr(emptyAddress);
  }

  function handleMapConfirm(result: any) {
    setDeliveryLocation({ lat: result.lat, lng: result.lng });
    setDeliveryEta(result.eta);
    setShowMap(false);
  }

  async function placeOrder() {
    if (!selectedAddr) { setError('Please select a delivery address'); return; }
    // If store has zones and no location picked yet, prompt map
    if (storeSettings?.hasZones && !deliveryLocation) {
      setError('Please confirm your delivery location on the map');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          items: cart, address: selectedAddr, paymentMethod,
          couponCode: coupon?.coupon?.code,
          deliveryLocation: deliveryLocation || undefined,
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
            const verifyRes = await fetch(`${API}/orders/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
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

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5">

            {/* Delivery Location */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800">Delivery Location</h2>
                {storeSettings?.estimatedDeliveryMinutes && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
                    🕐 Est. {storeSettings.estimatedDeliveryMinutes < 60
                      ? `${storeSettings.estimatedDeliveryMinutes} min`
                      : `${Math.floor(storeSettings.estimatedDeliveryMinutes / 60)}h ${storeSettings.estimatedDeliveryMinutes % 60 > 0 ? `${storeSettings.estimatedDeliveryMinutes % 60}m` : ''}`}
                  </span>
                )}
              </div>

              {deliveryLocation ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-xl">📍</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-800">Location confirmed</p>
                    <p className="text-xs text-emerald-600">
                      {deliveryEta && `Estimated delivery: ${deliveryEta}`}
                    </p>
                  </div>
                  <button onClick={() => setShowMap(true)} className="text-xs text-indigo-600 hover:underline">Change</button>
                </div>
              ) : (
                <button onClick={() => setShowMap(true)}
                  className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl p-4 text-left transition-colors group">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-indigo-100 transition-colors">📍</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Select on Map</p>
                    <p className="text-xs text-gray-400">Confirm your precise delivery location</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              )}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">📍</span> Delivery Address
                </h2>
                {addresses.length > 0 && !showNewAddr && (
                  <button onClick={() => setShowNewAddr(true)} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                    + Add New
                  </button>
                )}
              </div>
              
              {!showNewAddr && (
                <div className="space-y-3 mb-2">
                  {addresses.map((a: any) => (
                    <label key={a._id} className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${selectedAddr?._id === a._id ? 'border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500 ring-opacity-20' : 'hover:border-gray-300 hover:bg-gray-50'}`}>
                      <input type="radio" name="address" checked={selectedAddr?._id === a._id} onChange={() => setSelectedAddr(a)} className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer" />
                      <div className="text-sm flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-800">{a.name} <span className="text-gray-400 font-normal mx-1">•</span> {a.phone}</p>
                          {a.isDefault && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">DEFAULT</span>}
                        </div>
                        <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{a.line1}{a.line2 ? `, ${a.line2}` : ''} <br/> {a.city}, {a.state} - <span className="font-medium text-gray-700">{a.pincode}</span></p>
                      </div>
                    </label>
                  ))}
                  {addresses.length === 0 && <p className="text-sm text-gray-500 italic">No addresses saved yet.</p>}
                </div>
              )}

              {showNewAddr && (
                <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-indigo-500">+</span> Enter New Address
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(['name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'] as const).map(f => (
                      <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={newAddr[f] || ''}
                        onChange={e => setNewAddr(a => ({ ...a, [f]: e.target.value }))}
                        className={`border-gray-200 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white shadow-sm transition-shadow ${f === 'line1' ? 'col-span-2' : ''}`} />
                    ))}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveNewAddress} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors w-full sm:w-auto">
                      Save Address
                    </button>
                    {addresses.length > 0 && (
                      <button onClick={() => setShowNewAddr(false)} className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-800 mb-4">Payment Method</h2>
              <div className="space-y-2">
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
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 sticky top-24">
              <h2 className="font-bold text-gray-800">Order Summary</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map(item => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">{item.name} × {item.qty}</span>
                    <span className="font-medium">₹{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{fmt(subtotal)}</span></div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-emerald-600 font-medium' : ''}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{fmt(discount)}</span></div>}
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span><span>₹{fmt(total)}</span>
              </div>

              {/* ETA badge */}
              {deliveryEta && (
                <div className="bg-indigo-50 rounded-xl px-3 py-2 text-xs text-indigo-700 font-medium text-center">
                  🚀 Estimated delivery: {deliveryEta}
                </div>
              )}

              <button onClick={placeOrder} disabled={loading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : `Pay ₹${fmt(total)}`}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
