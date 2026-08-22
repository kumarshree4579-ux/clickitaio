'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

function formatETA(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeZoneIdx, setActiveZoneIdx] = useState<number | null>(null);
  const [drawingZone, setDrawingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const drawingPointsRef = useRef<[number, number][]>([]);
  const drawingPolyRef = useRef<any>(null);
  const storeMarkerRef = useRef<any>(null);

  useEffect(() => {
    fetch(`${API}/settings`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(setSettings);
  }, []);

  // Load Leaflet dynamically (no SSR issues)
  useEffect(() => {
    if (!settings || mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [settings]);

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    const center = settings?.storeLocation || DEFAULT_CENTER;
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    mapInstanceRef.current = map;

    // Store marker
    const storeIcon = L.divIcon({ html: '🏪', className: '', iconSize: [30, 30] });
    storeMarkerRef.current = L.marker([center.lat, center.lng], { icon: storeIcon, draggable: true })
      .addTo(map)
      .bindPopup('Store Location')
      .on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        setSettings((s: any) => ({ ...s, storeLocation: { lat: pos.lat, lng: pos.lng } }));
      });

    // Draw existing zones
    renderZones(map, settings?.deliveryZones || []);

    // Map click for drawing
    map.on('click', (e: any) => {
      if (!drawingZone) return;
      const { lat, lng } = e.latlng;
      drawingPointsRef.current.push([lng, lat]);
      // Update preview polyline
      if (drawingPolyRef.current) map.removeLayer(drawingPolyRef.current);
      const pts = drawingPointsRef.current.map(([lo, la]) => [la, lo]);
      drawingPolyRef.current = L.polyline(pts, { color: '#6366f1', dashArray: '6' }).addTo(map);
    });
  }

  function renderZones(map: any, zones: any[]) {
    const L = (window as any).L;
    polygonsRef.current.forEach(p => map.removeLayer(p));
    polygonsRef.current = [];
    zones.forEach((zone, i) => {
      if (!zone.coordinates?.length) return;
      const latlngs = zone.coordinates.map(([lo, la]: [number, number]) => [la, lo]);
      const poly = L.polygon(latlngs, {
        color: zone.isActive ? '#6366f1' : '#9ca3af',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map).bindPopup(zone.name);
      polygonsRef.current.push(poly);
    });
  }

  function finishZone() {
    const pts = drawingPointsRef.current;
    if (pts.length < 3) { alert('Draw at least 3 points'); return; }
    const name = newZoneName.trim() || `Zone ${(settings.deliveryZones?.length || 0) + 1}`;
    const newZone = { name, coordinates: pts, isActive: true };
    const updated = [...(settings.deliveryZones || []), newZone];
    setSettings((s: any) => ({ ...s, deliveryZones: updated }));
    // Clear drawing state
    drawingPointsRef.current = [];
    if (drawingPolyRef.current) { mapInstanceRef.current?.removeLayer(drawingPolyRef.current); drawingPolyRef.current = null; }
    setDrawingZone(false);
    setNewZoneName('');
    renderZones(mapInstanceRef.current, updated);
  }

  function cancelDraw() {
    drawingPointsRef.current = [];
    if (drawingPolyRef.current) { mapInstanceRef.current?.removeLayer(drawingPolyRef.current); drawingPolyRef.current = null; }
    setDrawingZone(false);
  }

  function removeZone(i: number) {
    const updated = settings.deliveryZones.filter((_: any, idx: number) => idx !== i);
    setSettings((s: any) => ({ ...s, deliveryZones: updated }));
    renderZones(mapInstanceRef.current, updated);
  }

  function toggleZone(i: number) {
    const updated = settings.deliveryZones.map((z: any, idx: number) =>
      idx === i ? { ...z, isActive: !z.isActive } : z
    );
    setSettings((s: any) => ({ ...s, deliveryZones: updated }));
    renderZones(mapInstanceRef.current, updated);
  }

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
    <div className="max-w-6xl mx-auto pb-12">
      {/* Sticky Save Button (Floats on Top Right) */}
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

      {/* Header */}
      <div className="flex items-center justify-between mb-8 py-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Store Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage delivery zones, appearance, and configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* LEFT COLUMN (Main config, Map) */}
        <div className="xl:col-span-2 space-y-6 lg:space-y-8">
          
          {/* Map */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">Service Area Map</h2>
                <p className="text-xs text-gray-500 mt-0.5">Drag 🏪 to set store location · Click map to draw zone polygon</p>
              </div>
              <div className="flex gap-2">
                {!drawingZone ? (
                  <button onClick={() => setDrawingZone(true)}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 shadow-sm">
                    + Draw Zone
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input placeholder="Zone name" value={newZoneName} onChange={e => setNewZoneName(e.target.value)}
                      className="border rounded-lg px-2 py-1.5 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <button onClick={finishZone} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 shadow-sm">Finish</button>
                    <button onClick={cancelDraw} className="border px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-gray-50">Cancel</button>
                  </div>
                )}
              </div>
            </div>
            {drawingZone && (
              <div className="bg-amber-50 border-b border-amber-100 px-5 py-2 text-xs text-amber-700 font-medium">
                🖊 Click on the map to add polygon points. Click "Finish" when done (min 3 points).
              </div>
            )}
            <div ref={mapRef} style={{ height: 450 }} className="w-full bg-gray-100" />
          </div>

          {/* Zones list */}
          <Card 
            title="Delivery Zones" 
            desc="Manage active delivery areas drawn on the map"
            extra={<span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">{(settings.deliveryZones || []).length} zones</span>}
          >
            <div className="space-y-3">
              {(settings.deliveryZones || []).map((z: any, i: number) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${z.isActive ? 'border-indigo-100 bg-indigo-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${z.isActive ? 'bg-indigo-500 shadow-sm' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{z.name}</p>
                    <p className="text-xs text-gray-400">{z.coordinates?.length || 0} polygon points</p>
                  </div>
                  <button onClick={() => toggleZone(i)} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${z.isActive ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                    {z.isActive ? 'Active' : 'Disabled'}
                  </button>
                  <button onClick={() => removeZone(i)} className="text-red-400 hover:text-red-600 text-xs px-2 p-1.5 bg-red-50 hover:bg-red-100 rounded-md transition-colors">✕</button>
                </div>
              ))}
              {(settings.deliveryZones || []).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                  No zones yet — draw on the map above to create one
                </div>
              )}
            </div>
          </Card>

          {/* Trust Badges */}
          <Card 
            title="Trust Badges" 
            desc="Shown below the hero banner on the homepage"
            extra={
              <button onClick={() => setSettings((s: any) => ({ ...s, trustBadges: [...(s.trustBadges || []), { icon: '⭐', title: 'New Badge', subtitle: 'Description', isActive: true }] }))}
                className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">+ Add Badge</button>
            }
          >
            <div className="space-y-3">
              {(settings.trustBadges || []).map((b: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  <input value={b.icon} onChange={e => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], icon: e.target.value }; return { ...s, trustBadges: t }; })}
                    className="w-12 h-12 border border-gray-200 rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white shadow-sm" placeholder="🚚" />
                  <div className="flex-1 space-y-2">
                    <input value={b.title} onChange={e => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], title: e.target.value }; return { ...s, trustBadges: t }; })}
                      className={inp} placeholder="Badge Title" />
                    <input value={b.subtitle} onChange={e => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], subtitle: e.target.value }; return { ...s, trustBadges: t }; })}
                      className={inp} placeholder="Short Description" />
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], isActive: !t[i].isActive }; return { ...s, trustBadges: t }; })}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors text-center ${b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                      {b.isActive ? 'On' : 'Off'}
                    </button>
                    <button onClick={() => setSettings((s: any) => ({ ...s, trustBadges: s.trustBadges.filter((_: any, idx: number) => idx !== i) }))}
                      className="text-red-500 hover:text-red-700 text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-md transition-colors text-center">Remove</button>
                  </div>
                </div>
              ))}
              {!(settings.trustBadges?.length) && (
                <p className="text-center text-sm text-gray-400 py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">No trust badges configured</p>
              )}
            </div>
          </Card>

        </div>

        {/* RIGHT COLUMN (Settings) */}
        <div className="space-y-6 lg:space-y-8">
          
          {/* General Configuration */}
          <Card title="General Setup" desc="Core delivery rules and store info">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Store Name</label>
                <input className={inp} value={settings.storeName || ''} onChange={e => setSettings((s: any) => ({ ...s, storeName: e.target.value }))} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <div>
                  <p className="text-sm font-medium text-gray-800">Accept Deliveries</p>
                  <p className="text-xs text-gray-500">Toggle to pause ordering globally</p>
                </div>
                <button onClick={() => setSettings((s: any) => ({ ...s, isDeliveryEnabled: !s.isDeliveryEnabled }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${settings.isDeliveryEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.isDeliveryEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Estimated ETA (minutes)</label>
                <input type="number" className={inp} min={1} value={settings.estimatedDeliveryMinutes || 45}
                  onChange={e => setSettings((s: any) => ({ ...s, estimatedDeliveryMinutes: Number(e.target.value) }))} />
                <p className="text-xs text-gray-500 mt-1.5">Displayed as: <span className="font-semibold text-indigo-600">{formatETA(settings.estimatedDeliveryMinutes || 45)}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Delivery Fee (₹)</label>
                  <input type="number" className={inp} value={settings.deliveryCharge ?? 49}
                    onChange={e => setSettings((s: any) => ({ ...s, deliveryCharge: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Free Above (₹)</label>
                  <input type="number" className={inp} value={settings.freeDeliveryAbove ?? 500}
                    onChange={e => setSettings((s: any) => ({ ...s, freeDeliveryAbove: Number(e.target.value) }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Minimum Order Amount (₹)</label>
                  <input type="number" className={inp} value={settings.minOrderAmount ?? 0}
                    onChange={e => setSettings((s: any) => ({ ...s, minOrderAmount: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
          </Card>

          {/* Messaging */}
          <Card title="Customer Messaging" desc="Custom alerts shown to users">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Delivery Message <span className="text-gray-400 font-normal">(use {'{time}'} for ETA)</span></label>
                <textarea className={inp} rows={2} value={settings.deliveryMessage || ''} onChange={e => setSettings((s: any) => ({ ...s, deliveryMessage: e.target.value }))} />
                <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 p-2 rounded border border-gray-100">
                  Preview: {(settings.deliveryMessage || '').replace('{time}', formatETA(settings.estimatedDeliveryMinutes || 45))}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Unserviceable Area Error</label>
                <textarea className={inp} rows={2} value={settings.unserviceableMessage || ''}
                  onChange={e => setSettings((s: any) => ({ ...s, unserviceableMessage: e.target.value }))} />
              </div>
            </div>
          </Card>

          {/* App Theme */}
          <Card title="App Theme" desc="Customize web app branding">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Primary Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0" value={settings.appTheme?.primaryColor || '#4f46e5'} onChange={e => setSettings((s: any) => ({ ...s, appTheme: { ...s.appTheme, primaryColor: e.target.value } }))} />
                    <span className="text-xs text-gray-500 uppercase">{settings.appTheme?.primaryColor || '#4f46e5'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Secondary Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0" value={settings.appTheme?.secondaryColor || '#7c3aed'} onChange={e => setSettings((s: any) => ({ ...s, appTheme: { ...s.appTheme, secondaryColor: e.target.value } }))} />
                    <span className="text-xs text-gray-500 uppercase">{settings.appTheme?.secondaryColor || '#7c3aed'}</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                 <label className="text-xs font-medium text-gray-700 mb-1 block">Active Theme Name</label>
                 <input className={inp} value={settings.appTheme?.activeThemeName || 'default'} onChange={e => setSettings((s: any) => ({ ...s, appTheme: { ...s.appTheme, activeThemeName: e.target.value } }))} placeholder="e.g. Festival, Rainy, Default" />
                 <p className="text-xs text-gray-400 mt-1">Useful for seasonal themes.</p>
              </div>
            </div>
          </Card>


        </div>
      </div>
    </div>
  );
}
