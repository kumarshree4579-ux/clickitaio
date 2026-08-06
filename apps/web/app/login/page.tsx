'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch(`${API}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) setStep('otp');
    else setError('Failed to send OTP');
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch(`${API}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Invalid OTP'); return; }
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push('/');
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">Login / Sign Up</h1>
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {step === 'email' ? (
            <form onSubmit={requestOtp} className="space-y-3">
              <input type="email" placeholder="Enter your email" value={email}
                onChange={e => setEmail(e.target.value)} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-3">
              <p className="text-sm text-gray-500">OTP sent to <strong>{email}</strong></p>
              <input type="text" placeholder="Enter 6-digit OTP" value={otp}
                onChange={e => setOtp(e.target.value)} maxLength={6} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 tracking-widest text-center text-lg" />
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-sm text-gray-500 hover:text-gray-700">
                ← Change email
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
