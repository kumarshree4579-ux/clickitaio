'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

const empty = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', isDefault: false };

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    load();
  }, []);

  async function load() {
    const data = await fetch(`${API}/addresses`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setAddresses(data);
  }

  async function save() {
    const url = editing ? `${API}/addresses/${editing}` : `${API}/addresses`;
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    });
    setForm(empty); setEditing(null); setShowForm(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete address?')) return;
    await fetch(`${API}/addresses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Addresses</h1>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Add Address</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
            <h2 className="font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Address</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['name','phone','line1','line2','city','state','pincode'] as const).map(f => (
                <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={form[f] || ''}
                  onChange={e => setForm((a: any) => ({ ...a, [f]: e.target.value }))}
                  className={`border rounded-lg px-3 py-2 text-sm ${f === 'line1' ? 'col-span-2' : ''}`} />
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm((a: any) => ({ ...a, isDefault: e.target.checked }))} />
              Set as default address
            </label>
            <div className="flex gap-2">
              <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Save</button>
              <button onClick={() => setShowForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {addresses.map((a: any) => (
            <div key={a._id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800">{a.name} · {a.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                  <p className="text-sm text-gray-500">{a.city}, {a.state} - {a.pincode}</p>
                  {a.isDefault && <span className="mt-1 inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Default</span>}
                </div>
                <div className="flex gap-2 text-sm">
                  <button onClick={() => { setForm({ ...a, isDefault: a.isDefault }); setEditing(a._id); setShowForm(true); }}
                    className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => del(a._id)} className="text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {addresses.length === 0 && !showForm && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📍</p>
              <p>No addresses saved yet</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
