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
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [locating, setLocating] = useState(false);

  // Search with debounce
  useEffect(() => {
    if (searchQuery.length < 3) { setSearchResults([]); return; }
    const delay = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => setSearchResults(Array.isArray(data) ? data : []))
        .catch(() => {});
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  function handleSelectResult(r: any) {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    mapInstanceRef.current?.setView([lat, lon], 16);
    setSearchQuery(r.display_name.split(',')[0]);
    setSearchResults([]);
  }

  useEffect(() => {
    fetch(`${API}/settings/public`).then(r => r.json()).then(setStoreSettings).catch(() => {});
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
    const map = L.map(mapRef.current, { zoomControl: false }).setView([defaultCenter.lat, defaultCenter.lng], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OSM'
    }).addTo(map);

    // Zoom control on right
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // On map move, check delivery
    map.on('moveend', () => {
      const c = map.getCenter();
      checkDelivery(c.lat, c.lng);
    });

    map.on('click', (e: any) => {
      map.setView(e.latlng);
    });

    mapInstanceRef.current = map;
    setMapReady(true);

    // Initial delivery check
    checkDelivery(defaultCenter.lat, defaultCenter.lng);

    // Auto-locate with high accuracy
    requestLocation();
  }

  function requestLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 16);
        setLocating(false);
      },
      () => {
        // Permission denied or error — just stay at default, no error message
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function checkDelivery(lat: number, lng: number) {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/settings/check-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();

      // Reverse geocode for address
      let addressData: any = {};
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const geoData = await geoRes.json();
        if (geoData?.address) {
          const a = geoData.address;
          addressData = {
            line1: a.road || a.suburb || a.neighbourhood || '',
            line2: a.suburb || a.neighbourhood || '',
            city: a.city || a.town || a.village || a.county || '',
            state: a.state || '',
            pincode: a.postcode || '',
          };
        }
      } catch {}

      setResult({ ...data, lat, lng, addressData });
    } catch {
      // Network error — still allow confirm with coordinates
      setResult({ serviceable: true, lat, lng, message: '', addressData: {} });
    } finally {
      setChecking(false);
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 17);
        setLocating(false);
      },
      () => {
        setLocating(false);
        // Silently fail — no error shown
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">

      {/* ─── Map ─── */}
      <div className="relative flex-1 bg-gray-100">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Top bar: back + search */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center gap-2">
          <button onClick={onClose}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-700 shrink-0 active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white h-10 rounded-full px-4 text-[14px] shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-400"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl max-h-48 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button key={i} onClick={() => handleSelectResult(r)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-800 block truncate">{r.display_name.split(',')[0]}</span>
                    <span className="text-gray-400 text-xs truncate block">{r.display_name.split(',').slice(1, 3).join(',')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center pin — fixed in viewport center */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[999]">
          <div className="mb-8">
            <svg width="36" height="48" viewBox="0 0 36 48" fill="none" className="drop-shadow-lg">
              <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#4f46e5"/>
              <circle cx="18" cy="18" r="7" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Locate Me button */}
        <button onClick={handleLocateMe} disabled={locating}
          className="absolute bottom-5 right-3 z-[1000] bg-white shadow-lg border border-gray-100 rounded-full w-11 h-11 flex items-center justify-center active:scale-95 disabled:opacity-60">
          {locating ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
            </svg>
          )}
        </button>
      </div>

      {/* ─── Bottom sheet ─── */}
      <div className="bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] relative z-[1001] px-5 pt-5 pb-5 shrink-0 -mt-3">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {checking || locating ? (
          <div className="flex items-center gap-3 py-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-sm text-gray-500 font-medium">{locating ? 'Getting your location...' : 'Checking delivery...'}</p>
          </div>
        ) : result ? (
          <div>
            {/* Address display */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${result.serviceable ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                <svg className={`w-5 h-5 ${result.serviceable ? 'text-emerald-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-[15px] leading-tight">
                  {result.addressData?.line1 || result.addressData?.city || 'Selected Location'}
                </p>
                <p className="text-gray-500 text-xs mt-0.5 truncate">
                  {[result.addressData?.city, result.addressData?.state, result.addressData?.pincode].filter(Boolean).join(', ')}
                </p>
                {result.serviceable ? (
                  <span className="inline-block mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {result.message || 'Delivery available'}
                  </span>
                ) : (
                  <span className="inline-block mt-2 text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                    {result.message || 'Outside delivery area'}
                  </span>
                )}
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={() => onConfirm(result)}
              className={`w-full py-3.5 rounded-xl text-[15px] font-bold text-white transition-all active:scale-[0.98] ${
                result.serviceable
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200'
                  : 'bg-gray-800 hover:bg-gray-900'
              }`}
            >
              Confirm Location
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-gray-700 font-semibold text-[15px]">Set delivery location</p>
            <p className="text-gray-400 text-xs mt-1">Move the map to place the pin on your address</p>
          </div>
        )}
      </div>
    </div>
  );
}
