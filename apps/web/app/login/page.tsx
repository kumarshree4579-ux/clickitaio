'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      // Clear session and stay on login page (logout behaviour)
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('cart');
      localStorage.removeItem('coupon');
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch(`${API}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    const data = await res.json();
    setLoading(false);
    if (res.ok) { 
      setStep('otp'); 
      setCountdown(30); 
      setIsNewUser(data.isNewUser); 
    }
    else { setError(data.error || 'Failed to send OTP'); }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch(`${API}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, name: isNewUser ? name : undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Invalid OTP'); return; }
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push('/');
  }

  return (
    <div className="min-h-screen flex">

      {/* Left panel — decorative, hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden flex-col justify-between p-12">
        {/* Background blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <img src="/logo192.png" alt="Ecom" className="w-10 h-10 rounded-2xl object-contain" />
          <span className="text-white font-bold text-xl tracking-tight">Ecom</span>
        </Link>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Shop smarter,<br />live better.
            </h2>
            <p className="text-white/70 mt-3 text-lg leading-relaxed">
              Thousands of products, unbeatable prices, and lightning-fast delivery — all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: '🚚', text: 'Free shipping on orders above ₹500' },
              { icon: '↩️', text: 'Hassle-free 7-day returns' },
              { icon: '🔒', text: 'Secure payments via Razorpay & COD' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-white/90 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative text-white/40 text-sm">© {new Date().getFullYear()} Ecom. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 pt-5 pb-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo192.png" alt="Ecom" className="w-8 h-8 rounded-xl object-contain" />
            <span className="font-bold text-gray-900 text-base">Ecom</span>
          </Link>
          <Link href="/" className="text-xs text-indigo-600 font-medium hover:underline">
            ← Back to store
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-10">
          <div className="w-full max-w-sm">

            {/* Heading */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                {step === 'email' ? 'Welcome back 👋' : 'Check your inbox'}
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                {step === 'email'
                  ? 'Sign in with your email — no password needed.'
                  : <>We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span></>}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 sm:mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={requestOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com" autoFocus
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 text-sm">
                  {loading
                    ? <><Spinner /> Sending code...</>
                    : <>Continue with email <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                {/* OTP boxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">6-digit code</label>
                  <OtpInput value={otp} onChange={setOtp} />
                  <div className="flex items-center justify-between mt-2.5">
                    <p className="text-xs text-gray-400">Code expires in 10 minutes</p>
                    {countdown > 0
                      ? <p className="text-xs text-gray-400">Resend in {countdown}s</p>
                      : <button type="button" onClick={requestOtp as any}
                          className="text-xs text-indigo-600 hover:underline font-medium">Resend code</button>}
                  </div>
                </div>

                {isNewUser && (
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Full Name</label>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)} required={isNewUser}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                    />
                  </div>
                )}

                <button type="submit" disabled={loading || otp.length < 6 || (isNewUser && !name.trim())}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 text-sm">
                  {loading ? <><Spinner /> Verifying...</> : 'Verify & Sign In'}
                </button>
                <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); setCountdown(0); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Use a different email
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-5 sm:my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Guest browse */}
            <Link href="/products"
              className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3.5 rounded-2xl text-sm transition-all shadow-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Browse as guest
            </Link>

            <p className="text-center text-[11px] sm:text-xs text-gray-400 mt-5 sm:mt-6">
              By signing in, you agree to our{' '}
              <Link href="/pages/terms" className="text-indigo-600 hover:underline">Terms</Link> and{' '}
              <Link href="/pages/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = Array.from({ length: 6 });

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = digit;
    const next = arr.join('').slice(0, 6);
    onChange(next);
    if (digit && i < 5) {
      (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      (document.getElementById(`otp-${i - 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); e.preventDefault(); }
  }

  return (
    <div className="flex gap-2 sm:gap-3">
      {inputs.map((_, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
          className="flex-1 min-w-0 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
        />
      ))}
    </div>
  );
}
