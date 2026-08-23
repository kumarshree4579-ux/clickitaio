'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

export default function ProfileCompletePrompt() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [saving, setSaving] = useState(false);

  const [needsName, setNeedsName] = useState(false);
  const [needsMobile, setNeedsMobile] = useState(false);

  useEffect(() => {
    // Check if skipped this session
    if (sessionStorage.getItem('profilePromptSkipped')) return;

    // Check if user is logged in and has missing profile data
    const user = localStorage.getItem('user');
    if (!user) return;

    try {
      const parsed = JSON.parse(user);
      // Show prompt if name or mobile is missing
      if (!parsed.name || !parsed.mobile) {
        setNeedsName(!parsed.name);
        setNeedsMobile(!parsed.mobile);
        setName(parsed.name || '');
        setMobile(parsed.mobile || '');
        // Small delay so it doesn't flash on page load
        const timer = setTimeout(() => setShow(true), 500);
        return () => clearTimeout(timer);
      }
    } catch { }
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiFetch('/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || undefined, mobile: mobile.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data));
      }
    } catch { }
    setSaving(false);
    setShow(false);
  }

  function handleSkip() {
    // Mark as skipped so we don't ask again this session
    sessionStorage.setItem('profilePromptSkipped', '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleSkip} />

      {/* Sheet */}
      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-6 pb-2">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
          <h2 className="text-lg font-bold text-gray-900">Complete your profile</h2>
          <p className="text-sm text-gray-500 mt-1">Help us deliver to you better</p>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          {needsName && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                autoFocus
              />
            </div>
          )}
          {needsMobile && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mobile Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
