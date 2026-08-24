'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');
import { apiFetch } from '../../../lib/apiFetch';

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
  const [sessions, setSessions] = useState([]);
  const [activeZoneIdx, setActiveZoneIdx] = useState<number | null>(null);
  const [drawingZone, setDrawingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [drawPointCount, setDrawPointCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const drawingPointsRef = useRef<[number, number][]>([]);
  const drawingPolyRef = useRef<any>(null);
  const storeMarkerRef = useRef<any>(null);
  const drawingZoneRef = useRef(false);

  useEffect(() => {
    drawingZoneRef.current = drawingZone;
  }, [drawingZone]);

  useEffect(() => {
    apiFetch(`/settings`)
      .then(r => r.json()).then(setSettings);
    apiFetch(`/auth/sessions`)
      .then(r => r.json()).then(setSessions).catch(() => {});
  }, []);

  async function revokeSession(id: string) {
    if (!confirm('Log out this device?')) return;
    const res = await apiFetch(`/auth/sessions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSessions((s: any) => s.filter((x: any) => x._id !== id));
      if (id === 'current') {
        window.location.reload();
      }
    }
  }

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

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => setSearchResults(Array.isArray(data) ? data : []))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(delay);
  }, [searchQuery]);

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
      if (!drawingZoneRef.current) return;
      const { lat, lng } = e.latlng;
      drawingPointsRef.current.push([lng, lat]);
      setDrawPointCount(drawingPointsRef.current.length);
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
    setDrawPointCount(0);
    if (drawingPolyRef.current) { mapInstanceRef.current?.removeLayer(drawingPolyRef.current); drawingPolyRef.current = null; }
    setDrawingZone(false);
    setNewZoneName('');
    renderZones(mapInstanceRef.current, updated);
  }

  function cancelDraw() {
    drawingPointsRef.current = [];
    setDrawPointCount(0);
    if (drawingPolyRef.current) { mapInstanceRef.current?.removeLayer(drawingPolyRef.current); drawingPolyRef.current = null; }
    setDrawingZone(false);
  }

  function undoLastPoint() {
    if (drawingPointsRef.current.length === 0) return;
    drawingPointsRef.current.pop();
    setDrawPointCount(drawingPointsRef.current.length);
    const L = (window as any).L;
    if (drawingPolyRef.current) mapInstanceRef.current?.removeLayer(drawingPolyRef.current);
    const pts = drawingPointsRef.current.map(([lo, la]: [number, number]) => [la, lo]);
    if (pts.length > 0) {
      drawingPolyRef.current = L.polyline(pts, { color: '#6366f1', dashArray: '6' }).addTo(mapInstanceRef.current);
    } else {
      drawingPolyRef.current = null;
    }
  }

  function handleSelectResult(r: any) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    mapInstanceRef.current?.setView([lat, lng], 16);
    setSearchQuery(r.display_name);
    setSearchResults([]);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      mapInstanceRef.current?.setView([latitude, longitude], 15);
    });
  }

  function handleLatLngSubmit() {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapInstanceRef.current?.setView([lat, lng], 15);
    }
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

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!settings) return;
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }
    const t = setTimeout(() => {
      save();
    }, 1000);
    return () => clearTimeout(t);
  }, [settings]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch(`/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      // Ignore Failed to fetch during Next.js Fast Refresh/HMR
      if (!e.message?.includes('Failed to fetch')) {
        console.error(e);
      }
    } finally {
      setSaving(false);
    }
  }

  const [activeTab, setActiveTab] = useState('delivery');


  if (!settings) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 py-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
            {/* Minimal Auto-Save Indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold transition-colors ${
              saving ? 'bg-amber-100 text-amber-700' : saved ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {saving ? (
                <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : saved ? (
                <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Saved</>
              ) : (
                <><svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Up to date</>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Manage delivery zones, appearance, and configurations. Auto-saves as you type.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl mb-8 w-fit border border-gray-200">
        {[
          { id: 'delivery', name: 'Delivery & Map', icon: '📍' },
          { id: 'general', name: 'General Config', icon: '⚙️' },
          { id: 'badges', name: 'Trust Badges', icon: '⭐' },
          { id: 'notifications', name: 'Notifications', icon: '🔔' },
          { id: 'security', name: 'Security', icon: '🔐' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <span>{t.icon}</span>
            {t.name}
          </button>
        ))}
      </div>

      <div className="w-full">
        <div className={activeTab === 'delivery' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            <div className="xl:col-span-2 space-y-6">
              {/* Map */}
              <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${drawingZone ? 'border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]' : 'border-gray-200 shadow-sm'}`}>
                <div className={`px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${drawingZone ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50/30 border-gray-100'}`}>
                  <div>
                    <h2 className="font-bold text-gray-900 text-base">{drawingZone ? 'Drawing Mode Active' : 'Service Area Map'}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {drawingZone 
                        ? 'Click on the map to add points for your delivery boundary. Minimum 3 points.' 
                        : 'Manage the physical boundaries where you accept orders.'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    {!drawingZone ? (
                      <button onClick={() => setDrawingZone(true)}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-transform active:scale-95">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                        Draw New Zone
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-indigo-100 shadow-sm">
                        <input placeholder="Name this zone..." value={newZoneName} onChange={e => setNewZoneName(e.target.value)}
                          className="border-none bg-gray-50 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" autoFocus />
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md">{drawPointCount} pts</span>
                        
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        
                        <button onClick={undoLastPoint} className="text-gray-500 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Undo point">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        </button>
                        <button onClick={finishZone} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 shadow-sm transition-transform active:scale-95">Save</button>
                        <button onClick={cancelDraw} className="text-gray-500 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Map Tools */}
                <div className="px-6 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center gap-4">
                  <button onClick={useMyLocation} className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                    📍 Find Me
                  </button>
                  
                  <div className="relative flex-1 min-w-[200px]">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <input 
                      type="text" placeholder="Search address to jump..." 
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl max-h-56 overflow-y-auto z-50 py-1">
                        {searchResults.map((r, i) => (
                          <button key={i} onClick={() => handleSelectResult(r)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 truncate flex flex-col gap-0.5 last:border-0">
                            <span className="font-semibold text-gray-900 truncate">{r.display_name.split(',')[0]}</span>
                            <span className="text-gray-400 text-xs truncate">{r.display_name.split(',').slice(1).join(',')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div ref={mapRef} style={{ height: 500 }} className="w-full bg-gray-100 relative z-0" />
              </div>
            </div>

            <div className="xl:col-span-1 space-y-6">
              {/* Zones list */}
              <Card 
                title="Active Zones" 
                desc="Manage your drawn delivery areas"
                extra={<span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">{(settings.deliveryZones || []).length} zones</span>}
              >
                <div className="space-y-3 mt-4">
                  {(settings.deliveryZones || []).map((z: any, i: number) => (
                    <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${z.isActive ? 'border-indigo-100 bg-indigo-50/40 shadow-sm' : 'border-gray-100 bg-gray-50/50 opacity-75'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-bold truncate ${z.isActive ? 'text-indigo-900' : 'text-gray-500'}`}>{z.name}</p>
                        <p className="text-xs font-medium text-gray-400 mt-0.5">{z.coordinates?.length || 0} polygon points</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleZone(i)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${z.isActive ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                          {z.isActive ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={() => removeZone(i)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Zone">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {(settings.deliveryZones || []).length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <div className="text-3xl mb-2">🗺️</div>
                      <p className="font-medium text-gray-600">No zones defined yet</p>
                      <p className="mt-1 text-xs">Draw on the map to define your delivery boundaries.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className={activeTab === 'general' ? 'block' : 'hidden'}>
          <div className="max-w-3xl space-y-6">
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

        <div className={activeTab === 'badges' ? 'block' : 'hidden'}>
          <div className="max-w-3xl">
            <Card 
              title="Trust Badges" 
              desc="These display directly below the hero banner on the customer homepage to build trust."
              extra={
                <button onClick={() => setSettings((s: any) => ({ ...s, trustBadges: [...(s.trustBadges || []), { icon: '⭐', title: 'New Badge', subtitle: 'Short description', isActive: true }] }))}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                  Add Badge
                </button>
              }
            >
              <div className="space-y-4 mt-4">
                {(settings.trustBadges || []).map((b: any, i: number) => (
                  <div key={i} className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${b.isActive ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50 opacity-75'}`}>
                    <div className="flex flex-col items-center gap-2">
                      <input value={b.icon} onChange={e => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], icon: e.target.value }; return { ...s, trustBadges: t }; })}
                        className="w-16 h-16 border-2 border-gray-200 rounded-xl text-center text-2xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-gray-50 shadow-inner" placeholder="🚚" />
                      <span className="text-[10px] uppercase font-bold text-gray-400">Icon</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 block">Badge Title</label>
                        <input value={b.title} onChange={e => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], title: e.target.value }; return { ...s, trustBadges: t }; })}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 font-bold text-gray-900" placeholder="e.g. Free Delivery" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 block">Short Description</label>
                        <input value={b.subtitle} onChange={e => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], subtitle: e.target.value }; return { ...s, trustBadges: t }; })}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-gray-600" placeholder="e.g. On orders above $50" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 pt-6">
                      <button onClick={() => setSettings((s: any) => { const t = [...s.trustBadges]; t[i] = { ...t[i], isActive: !t[i].isActive }; return { ...s, trustBadges: t }; })}
                        className={`w-24 text-xs px-4 py-2.5 rounded-xl font-bold transition-colors text-center ${b.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                        {b.isActive ? 'VISIBLE' : 'HIDDEN'}
                      </button>
                      <button onClick={() => setSettings((s: any) => ({ ...s, trustBadges: s.trustBadges.filter((_: any, idx: number) => idx !== i) }))}
                        className="w-24 text-red-500 hover:text-red-700 text-xs px-4 py-2.5 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-center font-bold">Remove</button>
                    </div>
                  </div>
                ))}
                {!(settings.trustBadges?.length) && (
                  <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <div className="text-3xl mb-3">🏅</div>
                    <p className="font-semibold text-gray-600">No Trust Badges</p>
                    <p className="mt-1">Add badges to build trust with your customers.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        
        {/* ── Notifications Tab ── */}
        <div className={activeTab === 'notifications' ? 'block' : 'hidden'}>
          <div className="max-w-3xl">
            <Card title="Order Alert Settings" desc="Configure sound and duration for new order notifications.">
              <div className="space-y-5">
                {/* Sound Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Alert Sound</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'beep', label: 'Beep', icon: '🔊' },
                      { id: 'chime', label: 'Chime', icon: '🎵' },
                      { id: 'bell', label: 'Bell', icon: '🔔' },
                      { id: 'urgent', label: 'Urgent', icon: '🚨' },
                      { id: 'none', label: 'None', icon: '🔇' },
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSettings((prev: any) => ({ ...prev, orderAlertSound: s.id }))}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          settings?.orderAlertSound === s.id || (!settings?.orderAlertSound && s.id === 'beep')
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500/20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl block mb-1">{s.icon}</span>
                        <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Alert Duration</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="3"
                      max="30"
                      step="1"
                      value={settings?.orderAlertDuration || 10}
                      onChange={e => setSettings((prev: any) => ({ ...prev, orderAlertDuration: parseInt(e.target.value) }))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg min-w-[48px] text-center">
                      {settings?.orderAlertDuration || 10}s
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">How long the alert sound plays and auto-accept timer runs</p>
                </div>

                {/* Preview button */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      const sound = settings?.orderAlertSound || 'beep';
                      if (sound === 'none') return;
                      try {
                        const AC = window.AudioContext || (window as any).webkitAudioContext;
                        if (!AC) return;
                        const ctx = new AC();
                        const gain = ctx.createGain();
                        gain.connect(ctx.destination);
                        let t = ctx.currentTime;
                        gain.gain.setValueAtTime(0, t);
                        const freq = sound === 'chime' ? 523 : sound === 'bell' ? 1400 : sound === 'urgent' ? 1000 : 880;
                        for (let i = 0; i < 3; i++) {
                          const osc = ctx.createOscillator();
                          osc.connect(gain);
                          osc.type = sound === 'urgent' ? 'sawtooth' : sound === 'chime' ? 'sine' : 'square';
                          osc.frequency.setValueAtTime(freq, t);
                          gain.gain.setValueAtTime(0.4, t);
                          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                          osc.start(t);
                          osc.stop(t + 0.15);
                          t += 0.25;
                        }
                        setTimeout(() => ctx.close(), 2000);
                      } catch {}
                    }}
                    className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    Preview Sound (3s)
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className={activeTab === 'security' ? 'block' : 'hidden'}>
          <div className="max-w-3xl">
            <Card title="Active Devices" desc="Manage devices currently logged into your admin account.">
              <div className="space-y-4">
                {sessions.map((s: any) => (
                  <div key={s._id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xl shrink-0">
                        {s.isCurrent ? '📱' : '💻'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{s.ip}</p>
                          {s.isCurrent && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">CURRENT</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">{s.userAgent}</p>
                        <p className="text-xs text-gray-400 mt-1">Started: {new Date(s.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <button onClick={() => revokeSession(s.isCurrent ? 'current' : s._id)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors border border-red-100">
                      Log out
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

      </div>

    </div>
  );
}
