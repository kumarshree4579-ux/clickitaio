'use client';
import { useLocation } from '../lib/LocationContext';
import DeliveryMap from './DeliveryMap';

export default function GlobalLocationPrompt() {
  const { isPromptOpen, closePrompt, setLocation } = useLocation();

  if (!isPromptOpen) return null;

  return (
    <DeliveryMap
      onClose={closePrompt}
      onConfirm={(result) => {
        setLocation({ lat: result.lat, lng: result.lng }, result.message);
        closePrompt();
      }}
    />
  );
}
