'use client';
import { useLocation } from '../lib/LocationContext';
import DeliveryMap from './DeliveryMap';

export default function GlobalLocationPrompt() {
  const { isPromptOpen, closePrompt, setLocation } = useLocation();

  if (!isPromptOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <DeliveryMap 
          onClose={closePrompt}
          onConfirm={(result) => {
            setLocation({ lat: result.lat, lng: result.lng }, result.message);
          }}
        />
      </div>
    </div>
  );
}
