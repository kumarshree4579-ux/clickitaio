'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, categories: 0, brands: 0, orders: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/products?limit=1`, { headers }).then(r => r.json()),
      fetch(`${API}/categories`, { headers }).then(r => r.json()),
      fetch(`${API}/brands`, { headers }).then(r => r.json()),
      fetch(`${API}/orders?limit=1`, { headers }).then(r => r.json()),
    ]).then(([p, c, b, o]) => {
      setStats({ products: p.total ?? 0, categories: c.length ?? 0, brands: b.length ?? 0, orders: o.total ?? 0 });
    }).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Products', value: stats.products, icon: '📦', color: 'bg-blue-500' },
    { label: 'Categories', value: stats.categories, icon: '🗂️', color: 'bg-green-500' },
    { label: 'Brands', value: stats.brands, icon: '🏷️', color: 'bg-purple-500' },
    { label: 'Total Orders', value: stats.orders, icon: '🛒', color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
            <div className={`${c.color} text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center`}>{c.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
