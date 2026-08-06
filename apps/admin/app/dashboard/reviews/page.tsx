'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');
const STARS = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');

  async function load() {
    const data = await fetch(`${API}/reviews/admin`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setReviews(data);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`${API}/reviews/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ status }) });
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete review?')) return;
    await fetch(`${API}/reviews/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  const filtered = reviews.filter(r => filter === 'all' || r.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r._id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-yellow-400 text-sm">{STARS(r.rating)}</span>
                  <span className="text-sm font-medium text-gray-800">{r.title || 'Review'}</span>
                  {r.isVerifiedPurchase && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">✓ Verified</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{r.body}</p>
                <p className="text-xs text-gray-400">By {r.customer?.name || r.customer?.email} · {r.product?.name} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {r.status !== 'approved' && <button onClick={() => updateStatus(r._id, 'approved')} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">Approve</button>}
                {r.status !== 'rejected' && <button onClick={() => updateStatus(r._id, 'rejected')} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200">Reject</button>}
                <button onClick={() => del(r._id)} className="text-xs text-gray-400 hover:text-red-500 px-2">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No {filter} reviews</div>}
      </div>
    </div>
  );
}
