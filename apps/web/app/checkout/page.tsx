'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DeliveryMap from '../../components/DeliveryMap';

import API from '../../lib/api';
import { apiFetch } from '../../lib/apiFetch';

interface CartItem { _id: string; name: string; price: number; image?: string; qty: number; }
interface Address { _id?: string; name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; country: string; location?: { lat: number; lng: number }; isDefault?: boolean }

const emptyAddress: Address = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' };
const fmt = (n: number) => n.toLocaleString('en-IN');

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
  const [newAddr, setNewAddr] = useState<Address>(emptyAddress);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showNewAddrSheet, setShowNewAddrSheet] = useState(false);
  const [bookingForOther, setBookingForOther] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [coupon, setCoupon] = useState<any>(null);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(c);
    if (!c.length) router.push('/cart');
    const user = localStorage.getItem('user');
    if (!user) { router.push('/login'); return; }

    const parsedUser = JSON.parse(user);
    setCurrentUser(parsedUser);
    setNewAddr(prev => ({ ...prev, name: parsedUser.name || '', phone: parsedUser.mobile || '' }));

    const saved = localStorage.getItem('coupon');
    if (saved) setCoupon(JSON.parse(saved));
    
    apiFetch('/addresses')
      .then(async r => {
        if (!r.ok) throw new Error('Failed to fetch addresses');
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAddresses(data);
          if (data.length) setSelectedAddr(data.find((a: any) => a.isDefault) || data[0]);
          else setShowNewAddrSheet(true);
        } else {
          setAddresses([]);
          setShowNewAddrSheet(true);
        }
      }).catch(() => {
        setAddresses([]);
        setShowNewAddrSheet(true);
      });
      
    fetch(`${API}/settings/public`).then(r => r.json()).then(setStoreSettings).catch(() => { });
  }, [router]);

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
    setShowNewAddrSheet(false);
    setShowAddressSheet(false);
    setNewAddr({ ...emptyAddress, name: currentUser?.name || '', phone: currentUser?.mobile || '' });
  }

  function handleMapConfirm(result: any) {
    setShowMap(false);
    setNewAddr(prev => ({
      ...prev,
      ...(result.addressData || {}),
      location: { lat: result.lat, lng: result.lng }
    }));
  }

  async function placeOrder() {
    if (!selectedAddr) {
      setError('Please select a delivery address.');
      setShowAddressSheet(true);
      return;
    }
    if (storeSettings?.hasZones && !selectedAddr.location) {
      setError('Address requires map location. Please add a new address.');
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
      {showMap && <DeliveryMap onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} />}

      <main className="bg-gray-50 min-h-screen pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pb-28">
        <div className="max-w-2xl mx-auto">
        {/* Sticky Title */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3 shadow-sm" style={{ paddingTop: 'max(14px, env(safe-area-inset-top))' }}>
          <Link href="/cart" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">Checkout</h1>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto px-4 mt-4">
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto p-4 space-y-4">
          
          {/* Address Dropdown Row */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
            <h2 className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Delivery Address</h2>
            <button onClick={() => setShowAddressSheet(true)} className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-3.5 rounded-xl border border-gray-200 transition-colors text-left group">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-lg shadow-inner">📍</div>
                <div className="flex-1 min-w-0">
                  {selectedAddr ? (
                    <>
                      <p className="font-bold text-gray-900 text-[15px] truncate">{selectedAddr.name}</p>
                      <p className="text-[13px] text-gray-500 truncate mt-0.5">{selectedAddr.line1}, {selectedAddr.city}</p>
                    </>
                  ) : (
                    <p className="font-bold text-indigo-600 text-[15px]">Select Delivery Address</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-indigo-600">
                <span className="text-xl font-medium leading-none">+</span>
                <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </button>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
            <h2 className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Payment Method</h2>
            <div className="space-y-2.5">
              {[
                { value: 'razorpay', label: 'Online Payment', sub: 'UPI, Cards, Net Banking, Wallets', icon: '💳' },
                { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: '💵' },
              ].map(opt => (
                <label key={opt.value} className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-colors ${paymentMethod === opt.value ? 'border-indigo-400 bg-indigo-50/50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${paymentMethod === opt.value ? 'bg-indigo-100' : 'bg-gray-100'}`}>{opt.icon}</div>
                    <div>
                      <p className={`font-bold text-[14px] ${paymentMethod === opt.value ? 'text-indigo-900' : 'text-gray-800'}`}>{opt.label}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{opt.sub}</p>
                    </div>
                  </div>
                  <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value as any)} className="w-5 h-5 accent-indigo-600" />
                </label>
              ))}
            </div>
          </div>
          
        </div>

        {/* Bottom Pay Bar */}
        <div className="fixed bottom-14 sm:bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="shrink-0 flex flex-col justify-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total Payable</span>
              <span className="text-[18px] font-black text-gray-900 leading-none">₹{fmt(total)}</span>
            </div>
            <button onClick={placeOrder} disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200/50 flex items-center justify-center gap-2 text-[15px] disabled:opacity-70">
              {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Complete Order' : 'Pay & Complete'}
              {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
            </button>
          </div>
        </div>
        </div>
      </main>

      {/* Address Selection Bottom Sheet */}
      {showAddressSheet && !showNewAddrSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAddressSheet(false)} />
          <div className="relative bg-white rounded-t-3xl h-[65vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom max-w-2xl mx-auto w-full">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white rounded-t-3xl">
              <h3 className="font-bold text-lg text-gray-900">Select Delivery Address</h3>
              <button onClick={() => setShowAddressSheet(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 font-bold text-lg leading-none transition-colors">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-gray-50">
              
              {/* Add New Address Button */}
              <button onClick={() => { 
                setNewAddr({ ...emptyAddress, name: currentUser?.name || '', phone: currentUser?.mobile || '' }); 
                setShowNewAddrSheet(true); 
              }} 
                className="w-full flex items-center gap-4 bg-white border border-indigo-200 border-dashed shadow-sm p-4 rounded-2xl hover:bg-indigo-50 transition-colors text-left group">
                 <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-light group-hover:scale-110 transition-transform">+</div>
                 <span className="font-bold text-indigo-700 text-[15px]">Add New Address</span>
              </button>

              {/* Existing Addresses */}
              {addresses.map(a => (
                 <label key={a._id} className={`flex items-start gap-4 p-4 bg-white border rounded-2xl cursor-pointer transition-all ${selectedAddr?._id === a._id ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                   <input type="radio" name="address" checked={selectedAddr?._id === a._id} onChange={() => { setSelectedAddr(a); setShowAddressSheet(false); }} className="mt-1 w-5 h-5 accent-indigo-600 cursor-pointer shrink-0" />
                   <div className="flex-1 min-w-0">
                     <p className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
                       {a.name}
                       {a.isDefault && <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Default</span>}
                     </p>
                     <p className="text-gray-500 text-[13px] font-medium mt-1">{a.phone}</p>
                     <p className="text-gray-500 text-[13px] mt-1.5 leading-relaxed pr-2">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} - <span className="font-semibold text-gray-700">{a.pincode}</span></p>
                   </div>
                 </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add New Address Overlay */}
      {showNewAddrSheet && !showMap && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4" style={{ paddingTop: 'env(safe-area-inset-top, 24px)' }}>
          <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 shrink-0 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <button onClick={() => setShowNewAddrSheet(false)} className="mr-2 text-gray-400 hover:text-gray-700"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
              {newAddr._id ? 'Edit Address' : 'Add New Address'}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <label className="flex items-center gap-2 text-[13px] font-bold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={bookingForOther} onChange={e => {
                  setBookingForOther(e.target.checked);
                  if (e.target.checked) setNewAddr(a => ({ ...a, name: '', phone: '' }));
                  else if (currentUser) setNewAddr(a => ({ ...a, name: currentUser.name || '', phone: currentUser.mobile || '' }));
                }} className="w-4 h-4 accent-indigo-600 rounded" />
                Booking for someone else?
              </label>
            </div>

            <div className="space-y-4">
              {newAddr.location ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-emerald-800">Map location selected</p>
                  </div>
                  <button onClick={() => setShowMap(true)} className="text-[13px] text-indigo-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm hover:bg-indigo-50">Change</button>
                </div>
              ) : (
                <button onClick={() => setShowMap(true)} className="w-full flex items-center justify-between border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 rounded-2xl p-4 text-left transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">📍</div>
                    <div>
                      <p className="text-[15px] font-bold text-indigo-900">Drop pin on map</p>
                      <p className="text-[11px] text-rose-500 font-bold uppercase tracking-wider mt-0.5">Required for delivery</p>
                    </div>
                  </div>
                  <span className="bg-indigo-600 text-white text-[13px] px-4 py-2 rounded-xl font-bold shadow-sm">Select</span>
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'] as const).map(f => (
                  <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={newAddr[f] || ''}
                    onChange={e => setNewAddr(a => ({ ...a, [f]: e.target.value }))}
                    className={`border-gray-200 border rounded-xl px-4 py-3.5 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-gray-50/50 shadow-sm transition-all ${f === 'line1' ? 'sm:col-span-2' : ''}`} />
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 shrink-0 max-w-2xl mx-auto w-full" style={{ paddingBottom: 'max(60px, env(safe-area-inset-bottom))' }}>
            <button onClick={saveNewAddress} className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[15px] font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95">
              Save Address
            </button>
          </div>
        </div>
      )}
    </>
  );
}
