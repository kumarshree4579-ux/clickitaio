'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/apiFetch';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (!data) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(data);
    setUser(parsed);
    setName(parsed.name || '');
    setMobile(parsed.mobile || '');
  }, [router]);

  async function saveProfile() {
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, call API to delete account
      logout();
    }
  }

  if (!user) return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse mb-6" />
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </main>
    </div>
  );

  const menuItems = [
    { href: '/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'My Orders' },
    { href: '/wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Wishlist' },
    { href: '/account/addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'My Address' },
    { href: '/about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'About' },
    { href: '/contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Contact Us' },
    { href: '/terms', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Terms' },
    { href: '/privacy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Privacy Policy' },
    { href: '/refund', icon: 'M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z', label: 'Refund Policy' },
    { href: '/support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Support' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="max-w-2xl mx-auto">

        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-[17px] font-black text-black tracking-tight">Account</h1>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-black bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-bold">
              Edit Profile
            </button>
          )}
        </div>

        <div className="p-3 sm:p-4">
          {/* Profile Card Area */}
          {!editing ? (
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white text-2xl font-black shrink-0">
                {(user.name || user.email || 'C')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-black text-black truncate">{user.name || 'Customer'}</h2>
                <p className="text-gray-600 text-[13px] font-medium truncate mt-0.5">{user.email}</p>
                {user.mobile && <p className="text-black text-[12px] mt-1.5 font-bold bg-gray-50 inline-block px-2 py-0.5 rounded-md border border-gray-100">{user.mobile}</p>}
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-black text-black text-[15px]">Edit Profile</h3>
              {error && <div className="text-black text-xs font-bold bg-gray-100 border border-gray-300 p-2 rounded-lg">{error}</div>}

              <div className="space-y-2.5">
                <input
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                />
                <input
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={saveProfile} disabled={saving} className="flex-1 bg-black text-white py-2.5 rounded-xl text-sm font-bold hover:bg-gray-900 active:scale-95 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)} className="flex-1 bg-gray-100 text-black py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 active:scale-95 transition-all border border-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Menu List */}
          <div className="mt-4 space-y-2">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider px-1 mb-2">Preferences & Info</h4>

            {menuItems.map(item => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-black transition-colors group">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 bg-gray-50 border border-gray-100 text-black rounded-lg flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                  </div>
                  <span className="font-bold text-black text-[14px]">{item.label}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}

            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider px-1 mt-6 mb-2">Account Actions</h4>

            <button onClick={logout} className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-black transition-colors group">
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 bg-gray-50 border border-gray-100 text-black rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </div>
                <span className="font-bold text-black text-[14px]">Logout</span>
              </div>
            </button>

            <button onClick={deleteAccount} className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-black hover:border-black transition-colors group mt-2">
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 bg-gray-50 border border-gray-100 text-black rounded-lg flex items-center justify-center group-hover:bg-gray-800 group-hover:border-gray-800 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <span className="font-bold text-black group-hover:text-white text-[14px] transition-colors">Delete Account</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto h-16 flex items-center justify-around px-2">
          {/* Home Icon */}
          <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-black transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-black tracking-wide">HOME</span>
          </Link>

          {/* Cart Icon */}
          <Link href="/cart" className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-black transition-colors relative">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute top-2 right-[25%] sm:right-[35%] w-2 h-2 bg-black rounded-full border-2 border-white"></span>
            <span className="text-[10px] font-black tracking-wide">CART</span>
          </Link>

          {/* Account Icon (Active State) */}
          <Link href="/account" className="flex flex-col items-center justify-center w-full h-full text-black">
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span className="text-[10px] font-black tracking-wide">ACCOUNT</span>
          </Link>
        </div>
      </div>
    </div>
  );
}