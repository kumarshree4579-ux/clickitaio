'use client';
import { useEffect, useRef, useState } from 'react';
import API from '../lib/api';

interface Props {
  onConfirm: (result: { lat: number; lng: number; serviceable: boolean; eta: string; message: string; addressData?: any }) => void;
  onClose: () => void;
}

export default function DeliveryMap({ onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [locating, setLocating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  // Search with debounce
  useEffect(() => {
    if (searchQuery.length < 3) { setSearchResults([]); setShowResults(false); return; }
    const delay = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => { setSearchResults(Array.isArray(data) ? data : []); setShowResults(true); })
        .catch(() => { });
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  function handleSelectResult(r: any) {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    mapInstanceRef.current?.setView([lat, lon], 16);
    setSearchQuery(r.display_name.split(',')[0]);
    setSearchResults([]);
    setShowResults(false);
  }

  useEffect(() => {
    fetch(`${API}/settings/public`).then(r => r.json()).then(setStoreSettings).catch(() => { });
  }, []);

  useEffect(() => {
    if (!storeSettings) return;
    loadLeaflet();
  }, [storeSettings]);

  function loadLeaflet() {
    if ((window as any).L) { initMap(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initMap;
    document.head.appendChild(script);
  }

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    const defaultCenter = storeSettings?.storeLocation || { lat: 20.5937, lng: 78.9629 };
    const map = L.map(mapRef.current, { zoomControl: false }).setView([defaultCenter.lat, defaultCenter.lng], 18);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    map.on('moveend', () => { const c = map.getCenter(); checkDelivery(c.lat, c.lng); });
    map.on('click', (e: any) => { map.setView(e.latlng); });
    mapInstanceRef.current = map;
    checkDelivery(defaultCenter.lat, defaultCenter.lng);
    requestLocation();
  }

  function requestLocation() {
    if (!navigator.geolocation) { setLocationDenied(true); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationDenied(false);
        mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 18);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function handleLocateMe() {
    if (!navigator.geolocation) { setLocationDenied(true); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationDenied(false);
        mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 18);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function checkDelivery(lat: number, lng: number) {
    setChecking(true); setResult(null);
    try {
      const res = await fetch(`${API}/settings/check-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      let addressData: any = {};
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const geoData = await geoRes.json();
        if (geoData?.address) {
          const a = geoData.address;
          addressData = {
            line1: [a.house_number, a.road || a.suburb || a.neighbourhood].filter(Boolean).join(', '),
            line2: a.suburb || a.neighbourhood || '',
            city: a.city || a.town || a.village || a.county || '',
            state: a.state || '',
            pincode: a.postcode || '',
          };
        }
      } catch { }
      setResult({ ...data, lat, lng, addressData });
    } catch {
      setResult({ serviceable: true, lat, lng, message: '', addressData: {} });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-900">

      {/* ── Map ── */}
      <div className="relative flex-1 min-h-0">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Top bar: back + search — padded for status bar */}
        <div className="absolute top-10 left-0 right-0 z-[1000] flex items-center gap-2 px-3 pb-3"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          {/* Back button */}
          <button onClick={onClose}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg text-gray-700 shrink-0 active:scale-95 transition-transform border border-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Search */}
          <div className="flex-1 relative">
            <div className="relative flex items-center">
              <svg className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search area, street, landmark..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="w-full bg-white h-10 rounded-xl pl-10 pr-4 text-[14px] shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-400 border border-gray-100"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
                  className="absolute right-3 text-gray-400 text-xl leading-none">&times;</button>
              )}
            </div>

            {/* Search dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 w-full bg-white shadow-2xl rounded-xl max-h-52 overflow-y-auto border border-gray-100 z-10">
                {searchResults.map((r, i) => (
                  <button key={i} onMouseDown={() => handleSelectResult(r)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-50 last:border-0 transition-colors flex items-start gap-3">
                    <svg className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-[13px] truncate">{r.display_name.split(',')[0]}</p>
                      <p className="text-gray-400 text-[11px] truncate">{r.display_name.split(',').slice(1, 3).join(', ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center pin */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[999]">
          <div className="flex flex-col items-center" style={{ marginBottom: '48px' }}>
            <svg width="32" height="42" viewBox="0 0 36 48" fill="none" className="drop-shadow-xl">
              <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#4f46e5" />
              <circle cx="18" cy="18" r="7" fill="white" />
            </svg>
            <div className="w-2 h-2 bg-gray-900/20 rounded-full mt-[-4px] scale-x-[2] blur-[2px]" />
          </div>
        </div>

        {/* Locate Me button */}
        <button onClick={handleLocateMe} disabled={locating}
          className="absolute bottom-6 right-4 z-[1000] bg-white shadow-xl border border-gray-100 rounded-xl w-12 h-12 flex items-center justify-center active:scale-95 disabled:opacity-60 transition-transform">
          {locating ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          )}
        </button>

        {/* Location Permission Denied Banner */}
        {locationDenied && (
          <div className="absolute bottom-24 left-4 right-4 z-[1001] bg-gray-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-[14px]">Location Permission Required</p>
                <p className="text-gray-300 text-[12px] mt-1 leading-snug">
                  Please enable location access in your device Settings → App Permissions → Location.
                </p>
                <button onClick={() => setLocationDenied(false)}
                  className="mt-2.5 text-[12px] font-bold text-orange-400 hover:text-orange-300 transition-colors">
                  Dismiss — I'll search manually
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Sheet ── */}
      <div className="bg-white shrink-0 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[1001]"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-5 pt-3">
          {/* Title */}
          <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Delivery Location</p>

          {checking || locating ? (
            <div className="flex items-center gap-3 py-3">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-sm text-gray-500 font-medium">{locating ? 'Getting your location...' : 'Checking delivery availability...'}</p>
            </div>
          ) : result ? (
            <>
              {/* Address row */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${result.serviceable ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                  <svg className={`w-5 h-5 ${result.serviceable ? 'text-emerald-600' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-[15px] leading-tight truncate">
                    {result.addressData?.line1 || result.addressData?.city || 'Selected Location'}
                  </p>
                  <p className="text-gray-500 text-[12px] mt-0.5 truncate">
                    {[result.addressData?.city, result.addressData?.state, result.addressData?.pincode].filter(Boolean).join(', ')}
                  </p>
                  <span className={`inline-block mt-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg ${result.serviceable ? 'text-emerald-700 bg-emerald-50' : 'text-orange-700 bg-orange-50'}`}>
                    {result.serviceable ? (result.message || '✓ Delivery available') : (result.message || '✗ Outside delivery area')}
                  </span>
                </div>
              </div>

              {/* Confirm button */}
              <button onClick={() => onConfirm(result)}
                className={`w-full py-4 rounded-xl text-[15px] font-bold text-white transition-all active:scale-[0.98] shadow-md ${result.serviceable ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-gray-800 hover:bg-gray-900 shadow-gray-300'}`}>
                {result.serviceable ? 'Confirm Location' : 'Confirm Anyway'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 gap-2">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-bold text-[15px]">Set your delivery location</p>
              <p className="text-gray-400 text-[13px] text-center">Move the map or search to place the pin on your address</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
