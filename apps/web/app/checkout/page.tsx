'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';

const API = process.env.NEXT_PUBLIC_API_URL;

interface CartItem { _id: string; name: string; price: number; image?: string; qty: number; }
interface Address { _id?: string; name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; country: string; }

const emptyAddress: Address = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' };

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

  const token = () => localStorage.getItem('token');

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(c);
    if (!c.length) router.push('/cart');
    const user = localStorage.getItem('user');
    if (!user) { router.push('/login'); return; }
    fetch(`${API}/addresses`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(data => {
        setAddresses(data);
        if (data.length) setSelectedAddr(data.find((a: any) => a.isDefault) || data[0]);
        else setShowNewAddr(true);
      });
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shipping;

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

  async function placeOrder() {
    if (!selectedAddr) { setError('Please select a delivery address'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ items: cart, address: selectedAddr, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to place order'); setLoading(false); return; }

      if (paymentMethod === 'cod') {
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cart-updated'));
        router.push(`/orders/${data.order._id}?success=1`);
        return;
      }

      // Razorpay
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
              window.dispatchEvent(new Event('cart-updated'));
              router.push(`/orders/${data.order._id}?success=1`);
            } else {
              setError('Payment verification failed');
            }
          },
          prefill: { name: selectedAddr.name, contact: selectedAddr.phone },
          theme: { color: '#2563eb' },
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-4">Delivery Address</h2>
              <div className="space-y-2 mb-4">
                {addresses.map((a: any) => (
                  <label key={a._id} className={`flex gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedAddr?._id === a._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="address" checked={selectedAddr?._id === a._id} onChange={() => setSelectedAddr(a)} className="mt-1" />
                    <div className="text-sm">
                      <p className="font-medium">{a.name} · {a.phone}</p>
                      <p className="text-gray-500">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} - {a.pincode}</p>
                    </div>
                  </label>
                ))}
              </div>

              {!showNewAddr ? (
                <button onClick={() => setShowNewAddr(true)} className="text-sm text-blue-600 hover:underline">+ Add new address</button>
              ) : (
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">New Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(['name','phone','line1','line2','city','state','pincode'] as const).map(f => (
                      <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={newAddr[f] || ''}
                        onChange={e => setNewAddr(a => ({ ...a, [f]: e.target.value }))}
                        className={`border rounded-lg px-3 py-2 text-sm ${f === 'line1' ? 'col-span-2' : ''}`} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveNewAddress} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Save Address</button>
                    <button onClick={() => setShowNewAddr(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-4">Payment Method</h2>
              <div className="space-y-2">
                {[
                  { value: 'razorpay', label: '💳 Pay Online (Razorpay)', sub: 'UPI, Cards, Net Banking, Wallets' },
                  { value: 'cod', label: '💵 Cash on Delivery', sub: 'Pay when your order arrives' },
                ].map(opt => (
                  <label key={opt.value} className={`flex gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === opt.value ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value as any)} className="mt-1" />
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
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-gray-800">Order Summary</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map(item => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">{item.name} × {item.qty}</span>
                    <span className="font-medium">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1 text-sm text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-gray-800">
                <span>Total</span><span>₹{total}</span>
              </div>
              <button onClick={placeOrder} disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : `Pay ₹${total}`}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
