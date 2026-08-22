'use client';
import { useEffect, useRef, useState } from 'react';

import API from '../lib/api';

interface Props {
  onConfirm: (result: { lat: number; lng: number; serviceable: boolean; eta: string; message: string }) => void;
  onClose: () => void;
}

export default function DeliveryMap({ onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

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

  function handleSelectResult(r: any) {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    markerRef.current?.setLatLng([lat, lon]);
    mapInstanceRef.current?.setView([lat, lon], 16);
    checkDelivery(lat, lon);
    setSearchQuery(r.display_name);
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
    
    let center = storeSettings?.storeLocation || { lat: 20.5937, lng: 78.9629 };
    
    // If active zones exist, try to default to the center of the first zone
    if (storeSettings?.hasZones && storeSettings?.deliveryZones?.length > 0) {
      const firstZone = storeSettings.deliveryZones.find((z: any) => z.active);
      if (firstZone && firstZone.coordinates && firstZone.coordinates.length > 0) {
        let latSum = 0, lngSum = 0;
        firstZone.coordinates.forEach((c: any) => { latSum += c.lat; lngSum += c.lng; });
        center = { 
          lat: latSum / firstZone.coordinates.length, 
          lng: lngSum / firstZone.coordinates.length 
        };
      }
    }

    const map = L.map(mapRef.current).setView([center.lat, center.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Store marker
    const storeIcon = L.divIcon({ html: '<div style="font-size:24px">🏪</div>', className: '', iconSize: [30, 30] });
    L.marker([center.lat, center.lng], { icon: storeIcon }).addTo(map).bindPopup('Our Store');

    // Draggable pin is now replaced by a fixed center pin in the UI overlay
    // We will listen to the map's moveend event instead
    map.on('moveend', async () => {
      const center = map.getCenter();
      await checkDelivery(center.lat, center.lng);
    });

    // Allow user to tap/click anywhere on the map to center the pin there
    map.on('click', (e: any) => {
      map.setView(e.latlng);
    });

    mapInstanceRef.current = map;
    setMapReady(true);
    
    // Initial check for default center
    checkDelivery(center.lat, center.lng);
    setMapReady(true);

    // Try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15);
        // moveend event will trigger checkDelivery
      }, () => {});
    }
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
      
      // Perform Reverse Geocoding
      let addressData = {};
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const geoData = await geoRes.json();
        if (geoData && geoData.address) {
          const a = geoData.address;
          addressData = {
            line1: a.road || a.suburb || a.neighbourhood || '',
            city: a.city || a.town || a.village || a.county || '',
            state: a.state || '',
            pincode: a.postcode || ''
          };
        }
      } catch (e) {
        console.error("Reverse geocoding failed", e);
      }

      setResult({ ...data, lat, lng, addressData });
    } finally {
      setChecking(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      mapInstanceRef.current?.setView([latitude, longitude], 16);
      // moveend handles checkDelivery
    });
  }

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
      {/* Map Area taking remaining space */}
      <div className="relative flex-1 bg-gray-100">
        <div ref={mapRef} className="absolute inset-0" />
        
        {/* Floating Header over map */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:bg-gray-50 shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search a new address..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white h-11 rounded-full px-5 pr-10 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-100 shadow-xl rounded-2xl max-h-56 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSelectResult(r)}
                    className="w-full text-left px-5 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-gray-900 truncate">{r.display_name.split(',')[0]}</span>
                    <span className="text-gray-500 text-xs truncate">{r.display_name.split(',').slice(1).join(',')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Center Pin Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000] pb-9">
          <div className="animate-bounce" style={{ fontSize: '40px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>📍</div>
        </div>
        
        {/* Use my location button */}
        <button onClick={useMyLocation}
          className="absolute bottom-6 right-4 z-[1000] bg-white shadow-xl border border-gray-100 rounded-full px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Locate Me
        </button>
      </div>

      {/* Bottom Sheet Card */}
      <div className="bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] relative z-[1001] flex flex-col px-6 pt-7 pb-6 shrink-0 mt-[-20px]">
        {/* Drag handle pill */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full absolute top-3 left-1/2 -translate-x-1/2"></div>
        
        <div className="min-h-[140px] flex flex-col justify-between">
          {checking ? (
            <div className="flex flex-col items-center justify-center flex-1 py-4">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 font-medium text-sm animate-pulse">Locating you...</p>
            </div>
          ) : result ? (
            <div className="flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className={`mt-1 p-2 rounded-full ${result.serviceable ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {result.serviceable ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg truncate">
                    {result.addressData?.line1 || result.addressData?.city || 'Selected Location'}
                  </h3>
                  <p className="text-gray-500 text-sm leading-snug mt-1 truncate">
                    {result.addressData?.city && `${result.addressData.city}, `}
                    {result.addressData?.state && `${result.addressData.state} `}
                    {result.addressData?.pincode}
                  </p>
                  
                  {/* Serviceability Message */}
                  <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${result.serviceable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {result.message || (result.serviceable ? 'Serviceable' : 'Not Serviceable')}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => result && onConfirm(result)}
                className={`w-full py-3.5 rounded-xl text-base font-bold text-white shadow-lg transition-all active:scale-[0.98] mt-auto ${result.serviceable ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-gray-800 hover:bg-gray-900 shadow-gray-300'}`}>
                Confirm Location
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-4 text-center">
              <p className="text-gray-800 font-semibold mb-1">Where are you?</p>
              <p className="text-gray-500 text-sm">Move the pin to set your exact delivery location.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
