'use client';
import { useState } from 'react';
import API from '../../../lib/api';

const token = () => localStorage.getItem('token');

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    
    setLoading(true);
    setSuccess('');
    setError('');
    
    try {
      const res = await fetch(`${API}/notifications/broadcast`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token()}`
        },
        body: JSON.stringify({ title, message })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Push notification sent to all active devices successfully!');
        setTitle('');
        setMessage('');
      } else {
        setError(data.error || 'Failed to send broadcast');
      }
    } catch (err) {
      setError('Error sending broadcast. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
        <p className="text-gray-500 mt-2">Send real-time native push notifications to all connected Web and APK devices.</p>
      </div>

      {success && (
        <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 font-medium">
          <div className="text-xl">✅</div>
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3 font-medium">
          <div className="text-xl">❌</div>
          {error}
        </div>
      )}

      <form onSubmit={handleBroadcast} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Notification Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. FLASH SALE: 50% OFF!"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Notification Message</label>
          <textarea
            required
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Use code FLASH50 at checkout for the next 2 hours."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title || !message}
          className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Sending Broadcast...' : 'Broadcast to All Devices'}
          {!loading && <span className="text-xl">🚀</span>}
        </button>
      </form>
    </div>
  );
}
