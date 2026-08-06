'use client';
import { useRef, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API}/import/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: formData,
    });
    setLoading(false);
    if (!res.ok) { const e = await res.json(); setError(e.error || 'Import failed'); return; }
    setResult(await res.json());
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function downloadTemplate() {
    const headers = ['SKU', 'Product Name', 'Category', 'Brand', 'MRP', 'Price', 'Stock', 'Description', 'Weight', 'Image1', 'Image2', 'Image3'];
    const sample = ['SKU001', 'Sample Product', 'Electronics', 'Samsung', '999', '799', '50', 'A great product', '0.5', 'https://example.com/img1.jpg', '', ''];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'product_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Excel / CSV Import</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700 space-y-1">
        <p className="font-semibold">Required columns:</p>
        <p className="font-mono text-xs bg-blue-100 p-2 rounded">SKU, Product Name, Category, Brand, MRP, Price, Stock, Description, Weight, Image1...Image20</p>
        <p>• Existing SKUs will be <strong>updated</strong>, new SKUs will be <strong>created</strong></p>
        <p>• Category and Brand must match existing names exactly</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <form onSubmit={handleUpload} className="space-y-4">
          <label htmlFor="file-input" className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm text-gray-600 mb-1">Upload Excel (.xlsx) or CSV file</p>
            {fileName ? <p className="text-xs text-blue-600 font-medium">{fileName}</p> : <p className="text-xs text-gray-400">Click to choose file</p>}
            <input ref={fileRef} id="file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
          </label>

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading || !fileName}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Importing...' : 'Import Products'}
            </button>
            <button type="button" onClick={downloadTemplate}
              className="border px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50">
              ⬇ Download Template
            </button>
          </div>
        </form>

        {result && (
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total', value: result.summary.total, color: 'bg-gray-100 text-gray-700' },
                { label: 'Created', value: result.summary.created, color: 'bg-green-100 text-green-700' },
                { label: 'Updated', value: result.summary.updated, color: 'bg-blue-100 text-blue-700' },
                { label: 'Errors', value: result.summary.errors, color: 'bg-red-100 text-red-700' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-lg p-3 text-center`}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            {result.results.filter((r: any) => r.status === 'error').length > 0 && (
              <div className="bg-red-50 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-red-700 mb-1">Errors:</p>
                {result.results.filter((r: any) => r.status === 'error').map((r: any) => (
                  <p key={r.row} className="text-xs text-red-600">Row {r.row} ({r.sku}): {r.error}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
