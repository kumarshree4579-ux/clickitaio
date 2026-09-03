'use client';

export default function ReloadButton({ message, label = "Reload" }: { message?: string, label?: string }) {
  return (
    <div className="text-center py-4 flex flex-col items-center justify-center gap-4">
      {message && <p className="text-gray-500 font-medium">{message}</p>}
      <button 
        onClick={() => window.location.reload()} 
        className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        {label}
      </button>
    </div>
  );
}
