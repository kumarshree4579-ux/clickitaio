'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import API from '../../../lib/api';

function CartsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCarts();
  }, [status, page]);

  async function fetchCarts() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/carts/admin?status=${status}&page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCarts(data.carts || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { value: 'all', label: 'All Carts' },
    { value: 'active', label: 'Active Carts' },
    { value: 'abandoned', label: 'Abandoned Carts' }
  ];

  const fmt = (n: number) => n.toLocaleString('en-IN');
  const formatDate = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Carts</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor live and abandoned carts</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl w-max">
          {tabs.map(t => (
            <button key={t.value} 
              onClick={() => router.push(`/dashboard/carts?status=${t.value}`)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${status === t.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">User / Guest</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total Value</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : carts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No carts found.</td></tr>
              ) : carts.map(cart => {
                const isAbandoned = new Date(cart.lastActive).getTime() < Date.now() - 2 * 60 * 60 * 1000 && cart.items?.length > 0;
                
                return (
                  <tr key={cart._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {cart.user ? (
                        <div>
                          <div className="font-semibold text-gray-900">{cart.user.name || 'Registered User'}</div>
                          <div className="text-xs text-gray-500">{cart.user.email || cart.user.phone}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-gray-600">Guest User</div>
                          <div className="text-xs text-gray-400 font-mono">{cart.guestId}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {cart.items?.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden" title={item.product?.name}>
                            {item.product?.images?.[0] ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" /> : 'IMG'}
                          </div>
                        ))}
                        {cart.items?.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            +{cart.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{cart.items?.length} product(s)</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ₹{fmt(cart.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(cart.lastActive)}
                    </td>
                    <td className="px-6 py-4">
                      {isAbandoned ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Abandoned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button 
            disabled={page === 1} 
            onClick={() => router.push(`/dashboard/carts?status=${status}&page=${page - 1}`)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => router.push(`/dashboard/carts?status=${status}&page=${page + 1}`)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function CartsPage() {
  return (
    <Suspense fallback={<div className="p-6 max-w-6xl mx-auto animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div><div className="h-64 bg-gray-100 rounded-2xl"></div></div>}>
      <CartsPageContent />
    </Suspense>
  );
}
