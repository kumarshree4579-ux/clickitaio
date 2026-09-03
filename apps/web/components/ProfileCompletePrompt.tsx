'use client';
import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../lib/apiFetch';

export default function ProfileCompletePrompt() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem('profilePromptSkipped')) return;

    const user = localStorage.getItem('user');
    if (!user) return;

    try {
      const parsed = JSON.parse(user);
      if (!parsed.name || !parsed.mobile) {
        if (nameRef.current) nameRef.current.value = parsed.name || '';
        if (mobileRef.current) mobileRef.current.value = parsed.mobile || '';
        const timer = setTimeout(() => setShow(true), 500);
        return () => clearTimeout(timer);
      }
    } catch { }
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const name = nameRef.current?.value || '';
      const mobile = mobileRef.current?.value || '';
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

  function handleSkip(e?: React.MouseEvent) {
    if (e && e.target !== e.currentTarget) return;
    sessionStorage.setItem('profilePromptSkipped', '1');
    setShow(false);
  }

  if (!mounted) return null;

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let needsName = false;
  let needsMobile = false;
  let defaultName = '';
  let defaultMobile = '';

  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      needsName = !parsed.name;
      needsMobile = !parsed.mobile;
      defaultName = parsed.name || '';
      defaultMobile = parsed.mobile || '';
    } catch { }
  }

  if (!needsName && !needsMobile) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleSkip} />

      {/* Sheet */}
      <div
        className={`relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full sm:translate-y-8'
          }`}
        onClick={e => e.stopPropagation()}
      >
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
                ref={nameRef}
                defaultValue={defaultName}
                placeholder="Enter your full name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>
          )}
          {needsMobile && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mobile Number</label>
              <input
                type="tel"
                ref={mobileRef}
                defaultValue={defaultMobile}
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
            className="flex-[2] py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
