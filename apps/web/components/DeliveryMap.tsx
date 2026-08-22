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
    const center = storeSettings?.storeLocation || { lat: 20.5937, lng: 78.9629 };
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Store marker
    const storeIcon = L.divIcon({ html: '<div style="font-size:24px">🏪</div>', className: '', iconSize: [30, 30] });
    L.marker([center.lat, center.lng], { icon: storeIcon }).addTo(map).bindPopup('Our Store');

    // Draggable pin for customer location
    const pinIcon = L.divIcon({ html: '<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">📍</div>', className: '', iconSize: [30, 40], iconAnchor: [15, 40] });
    const marker = L.marker([center.lat, center.lng], { icon: pinIcon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      await checkDelivery(pos.lat, pos.lng);
    });

    map.on('click', async (e: any) => {
      marker.setLatLng(e.latlng);
      await checkDelivery(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    setMapReady(true);

    // Try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        marker.setLatLng([latitude, longitude]);
        map.setView([latitude, longitude], 15);
        checkDelivery(latitude, longitude);
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
      setResult({ ...data, lat, lng });
    } finally {
      setChecking(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      markerRef.current?.setLatLng([latitude, longitude]);
      mapInstanceRef.current?.setView([latitude, longitude], 16);
      checkDelivery(latitude, longitude);
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        {/* Header */}
        <div className="flex flex-col px-5 py-4 border-b border-gray-100 gap-3 relative z-[1001]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Select Delivery Location</h2>
              <p className="text-xs text-gray-400 mt-0.5">Search your address or drag the pin</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search address, city, or zip code..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl max-h-48 overflow-y-auto z-50">
                {searchResults.map((r, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSelectResult(r)}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 truncate flex flex-col gap-0.5"
                  >
                    <span className="font-medium text-gray-900 truncate">{r.display_name.split(',')[0]}</span>
                    <span className="text-gray-400 truncate">{r.display_name.split(',').slice(1).join(',')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="relative">
          <div ref={mapRef} style={{ height: 320 }} />
          {/* Use my location button */}
          <button onClick={useMyLocation}
            className="absolute bottom-3 right-3 z-[1000] bg-white shadow-lg border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            My Location
          </button>
        </div>

        {/* Result */}
        <div className="px-5 py-4">
          {checking && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Checking delivery availability...
            </div>
          )}

          {!checking && result && (
            <div className={`rounded-xl p-3.5 flex items-start gap-3 ${result.serviceable ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <span className="text-xl shrink-0">{result.serviceable ? '✅' : '❌'}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${result.serviceable ? 'text-emerald-800' : 'text-red-700'}`}>
                  {result.serviceable ? result.message : 'Not Serviceable'}
                </p>
                {!result.serviceable && <p className="text-xs text-red-600 mt-0.5">{result.message}</p>}
              </div>
            </div>
          )}

          {!checking && !result && mapReady && (
            <p className="text-sm text-gray-400 text-center py-1">Tap the map or drag the pin to check delivery</p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            disabled={!result?.serviceable}
            onClick={() => result?.serviceable && onConfirm(result)}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
