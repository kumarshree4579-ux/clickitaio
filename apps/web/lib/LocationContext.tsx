'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API from './api';

type Point = { lat: number; lng: number };
type Zone = { name: string; coordinates: [number, number][]; isActive: boolean };

interface LocationState {
  location: Point | null;
  addressString: string;
  isServiceable: boolean | null; // null if checking
  serviceabilityMessage: string;
  isPromptOpen: boolean;
  setLocation: (loc: Point, address: string, message?: string) => void;
  openPrompt: () => void;
  closePrompt: () => void;
}

const LocationContext = createContext<LocationState | undefined>(undefined);

// Ray-casting algorithm for point in polygon
function isPointInPolygon(point: Point, polygon: [number, number][]) {
  // polygon coordinates are [lng, lat]
  const x = point.lng, y = point.lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<Point | null>(null);
  const [addressString, setAddressString] = useState<string>('');
  const [isServiceable, setIsServiceable] = useState<boolean | null>(null);
  const [serviceabilityMessage, setServiceabilityMessage] = useState('');
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [hasZones, setHasZones] = useState(false);
  const [unserviceableMsg, setUnserviceableMsg] = useState('Location is unserviceable');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Load saved location
    const savedLoc = localStorage.getItem('deliveryLocation');
    const savedAddr = localStorage.getItem('deliveryAddressString');
    if (savedLoc) setLocationState(JSON.parse(savedLoc));
    if (savedAddr) setAddressString(savedAddr);

    // Fetch store settings for zones
    fetch(`${API}/settings/public`)
      .then(res => res.json())
      .then(data => {
        const activeZones = (data.deliveryZones || []).filter((z: Zone) => z.isActive);
        setZones(activeZones);
        setHasZones(activeZones.length > 0);
        if (data.unserviceableMessage) setUnserviceableMsg(data.unserviceableMessage);
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (!location && hasZones) {
      // Need location but don't have it — silently show prompt without error messages
      setIsPromptOpen(true);
      setIsServiceable(null); // null = unknown, not false
      return;
    }

    if (location && hasZones) {
      // Check if inside any zone
      let inside = false;
      for (const zone of zones) {
        if (isPointInPolygon(location, zone.coordinates)) {
          inside = true;
          break;
        }
      }
      setIsServiceable(inside);
      if (!inside) setServiceabilityMessage(unserviceableMsg);
      else setServiceabilityMessage('');
    } else {
      // No zones defined, everywhere is serviceable
      setIsServiceable(true);
      setServiceabilityMessage('');
    }
  }, [location, zones, hasZones, initialized, unserviceableMsg]);

  const setLocation = (loc: Point, address: string, message?: string) => {
    setLocationState(loc);
    setAddressString(address);
    if (message) setServiceabilityMessage(message);
    localStorage.setItem('deliveryLocation', JSON.stringify(loc));
    localStorage.setItem('deliveryAddressString', address);
    setIsPromptOpen(false);
  };

  return (
    <LocationContext.Provider value={{
      location,
      addressString,
      isServiceable,
      serviceabilityMessage,
      isPromptOpen,
      setLocation,
      openPrompt: () => setIsPromptOpen(true),
      closePrompt: () => setIsPromptOpen(false)
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
}
