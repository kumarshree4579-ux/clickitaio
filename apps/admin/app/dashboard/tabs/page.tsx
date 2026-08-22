'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors';

const Card = ({ title, desc, children, extra }: any) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
      <div>
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {extra && <div>{extra}</div>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default function TabsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/settings`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(setSettings);
  }, []);

  async function save() {
    setSaving(true);
    await fetch(`${API}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!settings) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Sticky Save Button */}
      <div className="sticky top-6 z-50 w-full flex justify-end h-0 overflow-visible pointer-events-none pr-4 sm:pr-0">
        <button onClick={save} disabled={saving}
          className={`pointer-events-auto flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-bold tracking-wide uppercase transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border ${
            saved 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-white text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-indigo-100/50 border-gray-200/80'
          } disabled:opacity-50 disabled:cursor-not-allowed group`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Saved
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mb-8 py-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Storefront Tabs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage the scrollable top navigation tabs shown on the user app</p>
        </div>
      </div>

      <Card 
        title="Mobile Topbar Tabs" 
        desc="These tabs act as shortcuts to specific categories on the storefront."
        extra={
          <button onClick={() => setSettings((s: any) => ({ ...s, topbarTabs: [...(s.topbarTabs || []), { label: 'New Tab', categorySlug: '', isActive: true }] }))}
            className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors shadow-sm">+ Add Tab</button>
        }
      >
        <div className="space-y-4">
          {(settings.topbarTabs || []).map((t: any, i: number) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 relative group">
              <div className="absolute -left-3 -top-3 w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                {i + 1}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Tab Label (e.g. Food, Grocery)</label>
                  <input value={t.label} onChange={e => setSettings((s: any) => { const tabs = [...s.topbarTabs]; tabs[i] = { ...tabs[i], label: e.target.value }; return { ...s, topbarTabs: tabs }; })}
                    className={inp} placeholder="Display Name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Category Slug</label>
                  <input value={t.categorySlug} onChange={e => setSettings((s: any) => { const tabs = [...s.topbarTabs]; tabs[i] = { ...tabs[i], categorySlug: e.target.value }; return { ...s, topbarTabs: tabs }; })}
                    className={inp} placeholder="e.g. food, grocery" />
                </div>
              </div>
              
              <div className="flex flex-row sm:flex-col justify-end gap-2 shrink-0 sm:w-28 pt-5 sm:pt-0">
                <button onClick={() => setSettings((s: any) => { const tabs = [...s.topbarTabs]; tabs[i] = { ...tabs[i], isActive: !tabs[i].isActive }; return { ...s, topbarTabs: tabs }; })}
                  className={`flex-1 sm:flex-none text-xs px-3 py-2 rounded-lg font-bold transition-colors shadow-sm ${t.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                  {t.isActive ? 'Active' : 'Disabled'}
                </button>
                <button onClick={() => setSettings((s: any) => ({ ...s, topbarTabs: s.topbarTabs.filter((_: any, idx: number) => idx !== i) }))}
                  className="flex-1 sm:flex-none text-red-500 hover:text-red-700 text-xs px-3 py-2 font-semibold bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {!(settings.topbarTabs?.length) && (
            <div className="text-center text-sm text-gray-400 py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" /></svg>
              No tabs configured. Click Add Tab to create one.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
