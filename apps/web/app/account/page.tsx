'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Link from 'next/link';
import { apiFetch } from '../../lib/apiFetch';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    setName(parsed.name || '');
    setMobile(parsed.mobile || '');
    
    // Fetch active sessions
    apiFetch('/auth/sessions')
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setSessions(data) : null)
      .catch(() => {});
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, mobile })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
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
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    localStorage.removeItem('coupon');
    router.push('/');
  }

  async function revokeSession(id: string) {
    if (!confirm('Log out this device?')) return;
    const res = await apiFetch(`/auth/sessions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSessions(s => s.filter(x => x._id !== id));
    }
  }

  if (!user) return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-3 sm:space-y-4">
        {/* Skeleton profile card — matches final layout dimensions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-5 bg-gray-200 rounded w-36" />
              <div className="h-4 bg-gray-100 rounded w-48" />
              <div className="h-4 bg-gray-100 rounded w-28" />
            </div>
          </div>
        </div>
        {/* Skeleton menu items */}
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gray-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-40" />
            </div>
          </div>
        ))}
      </main>
    </>
  );

  const menuItems = [
    { href: '/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'My Orders', sub: 'Track and manage your orders', color: 'bg-indigo-50 text-indigo-600' },
    { href: '/wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Wishlist', sub: 'Products you saved for later', color: 'bg-rose-50 text-rose-500' },
    { href: '/account/addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Addresses', sub: 'Manage your delivery addresses', color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-3 sm:space-y-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm relative overflow-hidden">
          {/* Decorative background blob */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg shrink-0">
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            
            <div className="flex-1">
              {!editing ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-900 text-xl sm:text-2xl">{user.name || 'Customer'}</p>
                      <p className="text-gray-500">{user.email}</p>
                      {user.mobile && (
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                          {user.mobile}
                        </p>
                      )}
                      <span className="inline-block mt-3 text-xs bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-full capitalize tracking-wide">{user.role || 'customer'}</span>
                    </div>
                    
                    <button onClick={() => setEditing(true)}
                      className="bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors sm:w-auto w-full">
                      Edit Profile
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Edit Profile</h3>
                  
                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{error}</div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Mobile Number</label>
                      <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 9876543210"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address (Read-only)</label>
                      <input type="email" value={user.email} disabled
                        className="w-full border border-gray-100 bg-gray-50 text-gray-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveProfile} disabled={saving}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => { setEditing(false); setName(user.name || ''); setMobile(user.mobile || ''); setError(''); }}
                      className="bg-white text-gray-600 border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-1.5 sm:space-y-2">
          {menuItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 sm:gap-4 bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Active Devices */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Active Devices</h3>
            <div className="space-y-4">
              {sessions.map((s) => (
                <div key={s._id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{s.userAgent.split(' ')[0] || 'Unknown Device'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">IP: {s.ip} • Last active: {new Date(s.lastActive).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => revokeSession(s._id)} className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                    Log out
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 py-3.5 rounded-2xl font-medium text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </main>
    </>
  );
}
