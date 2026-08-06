'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const STARS = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/reviews?product=${productId}&status=approved`)
      .then(r => r.json()).then(d => { setReviews(d.items || []); setTotal(d.total || 0); });
  }, [productId]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { setError('Please login to submit a review'); return; }
    setSubmitting(true); setError('');
    const res = await fetch(`${API}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product: productId, ...form }),
    });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setSubmitted(true);
  }

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="mt-10 bg-white rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 text-lg">Customer Reviews</h2>
        {avgRating && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xl">{STARS(Math.round(Number(avgRating)))}</span>
            <span className="font-bold text-gray-800">{avgRating}</span>
            <span className="text-gray-500 text-sm">({total})</span>
          </div>
        )}
      </div>

      {/* Submit form */}
      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
          ✓ Review submitted! It will appear after approval.
        </div>
      ) : (
        <form onSubmit={submitReview} className="border rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-gray-700 text-sm">Write a Review</h3>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}
                className={`text-2xl transition-colors ${n <= form.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
            ))}
          </div>
          <input placeholder="Review title (optional)" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea placeholder="Share your experience..." value={form.body} required
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r._id} className="border-b pb-4 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 text-sm">{STARS(r.rating)}</span>
              {r.title && <span className="font-medium text-gray-800 text-sm">{r.title}</span>}
              {r.isVerifiedPurchase && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">✓ Verified</span>}
            </div>
            <p className="text-sm text-gray-600">{r.body}</p>
            <p className="text-xs text-gray-400 mt-1">{r.customer?.name || 'Customer'} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No reviews yet. Be the first!</p>}
      </div>
    </div>
  );
}
