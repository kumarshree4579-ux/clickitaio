'use client';
import { useEffect, useState } from 'react';

import API from '../lib/api';

function Stars({ n, size = 'sm' }: { n: number; size?: 'sm' | 'lg' }) {
  return (
    <div className={`flex gap-0.5 ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= n ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  );
}

function RatingBar({ count, total, n }: { count: number; total: number; n: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-gray-500 shrink-0">{n}</span>
      <span className="text-amber-400 shrink-0">★</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-gray-400 text-right shrink-0">{count}</span>
    </div>
  );
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`${API}/reviews?product=${productId}&status=approved&limit=20`)
      .then(r => r.json())
      .then(d => { setReviews(d.items || []); setTotal(d.total || 0); });
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
    setShowForm(false);
  }

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const dist = [5, 4, 3, 2, 1].map(n => ({
    n, count: reviews.filter(r => r.rating === n).length,
  }));

  return (
    <div id="reviews" className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-base sm:text-lg">Customer Reviews</h2>
        {!submitted && (
          <button onClick={() => setShowForm(s => !s)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Write a review
          </button>
        )}
      </div>

      <div className="px-5 sm:px-6 py-5 space-y-6">

        {/* Summary */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
            {/* Big number */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl px-8 py-5 shrink-0">
              <span className="text-5xl font-bold text-gray-900">{avg.toFixed(1)}</span>
              <Stars n={Math.round(avg)} size="lg" />
              <span className="text-xs text-gray-400 mt-1">{total} review{total !== 1 ? 's' : ''}</span>
            </div>
            {/* Distribution bars */}
            <div className="flex-1 space-y-1.5">
              {dist.map(d => <RatingBar key={d.n} n={d.n} count={d.count} total={total} />)}
            </div>
          </div>
        )}

        {/* Write review form */}
        {showForm && !submitted && (
          <form onSubmit={submitReview} className="bg-gray-50 rounded-2xl p-4 sm:p-5 space-y-3 border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Your Review</h3>
            {/* Star picker */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}
                    className={`text-3xl transition-transform hover:scale-110 ${n <= form.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Title (optional)</label>
              <input
                placeholder="Summarise your experience"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Review *</label>
              <textarea
                placeholder="Share your experience with this product..."
                value={form.body}
                required
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                rows={4}
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-200 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {submitted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-700 flex items-center gap-2">
            <span className="text-lg">✅</span>
            Review submitted! It will appear after approval.
          </div>
        )}

        {/* Reviews list */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r._id} className="flex gap-3 sm:gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {(r.customer?.name || r.customer?.email || 'C')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">{r.customer?.name || 'Customer'}</span>
                    {r.isVerifiedPurchase && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <Stars n={r.rating} />
                  {r.title && <p className="text-sm font-medium text-gray-800 mt-1.5">{r.title}</p>}
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-gray-500 font-medium text-sm">No reviews yet</p>
            <p className="text-gray-400 text-xs mt-1">Be the first to share your experience</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-indigo-600 hover:underline font-medium">
                Write a review
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
