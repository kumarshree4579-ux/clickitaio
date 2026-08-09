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

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';

  if (!settings) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Delivery Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set service area, delivery time and store location</p>
        </div>
        <button onClick={save} disabled={saving}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} disabled:opacity-50`}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>

      {/* Trust Badges */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Trust Badges</h2>
            <p className="text-xs text-gray-400 mt-0.5">Shown below the hero banner on homepage</p>
          </div>
          <button onClick={() => setSettings((s: any) => ({ ...s, trustBadges: [...(s.trustBadges || []), { icon: '⭐', title: 'New Badge', subtitle: 'Description', isActive: true }] }))}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700">+ Add Badge</button>
        </div>
        <div className="space-y-3">
          {(settings.trustBadges || []).map((b: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
              <input value={b.icon} onChange={e => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], icon: e.target.value }; return { ...s, trustBadges: t }; })}
                className="w-14 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="🚚" />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input value={b.title} onChange={e => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], title: e.target.value }; return { ...s, trustBadges: t }; })}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Title" />
                <input value={b.subtitle} onChange={e => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], subtitle: e.target.value }; return { ...s, trustBadges: t }; })}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Subtitle" />
              </div>
              <button onClick={() => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], isActive: !t[i].isActive }; return { ...s, trustBadges: t }; })}
                className={`text-xs px-2 py-1 rounded-lg shrink-0 ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                {b.isActive ? 'On' : 'Off'}
              </button>
              <button onClick={() => setSettings((s: any) => ({ ...s, trustBadges: s.trustBadges.filter((_: any, idx: number) => idx !== i) }))}
                className="text-red-400 hover:text-red-600 text-sm shrink-0">✕</button>
            </div>
          ))}
          {!(settings.trustBadges?.length) && (
            <p className="text-center text-sm text-gray-400 py-4 border-2 border-dashed border-gray-200 rounded-xl">No badges yet — click + Add Badge</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">General</h2>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Store Name</label>
            <input className={inp} value={settings.storeName || ''} onChange={e => setSettings((s: any) => ({ ...s, storeName: e.target.value }))} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Delivery Enabled</p>
              <p className="text-xs text-gray-400">Turn off to pause all deliveries</p>
            </div>
            <button onClick={() => setSettings((s: any) => ({ ...s, isDeliveryEnabled: !s.isDeliveryEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.isDeliveryEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.isDeliveryEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Estimated Delivery Time (minutes)</label>
            <input type="number" className={inp} min={1} value={settings.estimatedDeliveryMinutes || 45}
              onChange={e => setSettings((s: any) => ({ ...s, estimatedDeliveryMinutes: Number(e.target.value) }))} />
            <p className="text-xs text-indigo-500 mt-1">Shows as: <strong>{formatETA(settings.estimatedDeliveryMinutes || 45)}</strong></p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Delivery Message (use {'{time}'} for ETA)</label>
            <input className={inp} value={settings.deliveryMessage || ''} onChange={e => setSettings((s: any) => ({ ...s, deliveryMessage: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Preview: {(settings.deliveryMessage || '').replace('{time}', formatETA(settings.estimatedDeliveryMinutes || 45))}</p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Unserviceable Area Message</label>
            <textarea className={inp} rows={2} value={settings.unserviceableMessage || ''}
              onChange={e => setSettings((s: any) => ({ ...s, unserviceableMessage: e.target.value }))} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Delivery Charge (₹)</label>
              <input type="number" className={inp} value={settings.deliveryCharge ?? 49}
                onChange={e => setSettings((s: any) => ({ ...s, deliveryCharge: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Free Above (₹)</label>
              <input type="number" className={inp} value={settings.freeDeliveryAbove ?? 500}
                onChange={e => setSettings((s: any) => ({ ...s, freeDeliveryAbove: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min Order (₹)</label>
              <input type="number" className={inp} value={settings.minOrderAmount ?? 0}
                onChange={e => setSettings((s: any) => ({ ...s, minOrderAmount: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        {/* Zones list */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Delivery Zones</h2>
            <span className="text-xs text-gray-400">{(settings.deliveryZones || []).length} zones</span>
          </div>
          <p className="text-xs text-gray-400">Draw zones on the map. If no zones set, entire area is serviceable.</p>

          {(settings.deliveryZones || []).map((z: any, i: number) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${z.isActive ? 'border-indigo-100 bg-indigo-50/50' : 'border-gray-100 bg-gray-50'}`}>
              <div className={`w-3 h-3 rounded-full shrink-0 ${z.isActive ? 'bg-indigo-500' : 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{z.name}</p>
                <p className="text-xs text-gray-400">{z.coordinates?.length || 0} points</p>
              </div>
              <button onClick={() => toggleZone(i)} className={`text-xs px-2 py-1 rounded-lg ${z.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                {z.isActive ? 'Active' : 'Off'}
              </button>
              <button onClick={() => removeZone(i)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
            </div>
          ))}

          {(settings.deliveryZones || []).length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
              No zones yet — draw on the map below
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">Service Area Map</h2>
            <p className="text-xs text-gray-400 mt-0.5">Drag 🏪 to set store location · Click map to draw zone polygon</p>
          </div>
          <div className="flex gap-2">
            {!drawingZone ? (
              <button onClick={() => setDrawingZone(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700">
                + Draw Zone
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input placeholder="Zone name" value={newZoneName} onChange={e => setNewZoneName(e.target.value)}
                  className="border rounded-xl px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <button onClick={finishZone} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-emerald-700">Finish</button>
                <button onClick={cancelDraw} className="border px-3 py-2 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              </div>
            )}
          </div>
        </div>
        {drawingZone && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-xs text-amber-700 font-medium">
            🖊 Click on the map to add polygon points. Click "Finish" when done (min 3 points).
          </div>
        )}
        <div ref={mapRef} style={{ height: 420 }} />
      </div>
    </div>
  );
}
