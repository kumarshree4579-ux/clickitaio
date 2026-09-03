'use client';
import { useRef, useState } from 'react';
import { processAndUpload, UploadProgress } from '../../../lib/imageProcessor';
import * as XLSX from 'xlsx';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token') || '';

export default function ImportPage() {
  // ─── Media Upload State ───
  const mediaRef = useRef<HTMLInputElement>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaProgress, setMediaProgress] = useState<UploadProgress | null>(null);
  const [mediaResult, setMediaResult] = useState<{ uploaded: number; failed: number } | null>(null);

  // ─── CSV Import State ───
  const csvRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [existingSkus, setExistingSkus] = useState<string[]>([]);
  const [conflictAction, setConflictAction] = useState<'pending' | 'skip' | 'override' | null>(null);
  const [importProgress, setImportProgress] = useState<{
    total: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    missingImages: any[];
    errorList: any[];
  } | null>(null);

  // ─── Media Upload Handlers ───
  function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) setMediaFiles(Array.from(files));
  }

  async function startMediaUpload() {
    if (mediaFiles.length === 0) return;
    setMediaResult(null);
    const result = await processAndUpload(mediaFiles, API!, token(), (progress) => setMediaProgress(progress));
    setMediaResult({ uploaded: result.uploaded, failed: result.failed });
    setMediaFiles([]);
    if (mediaRef.current) mediaRef.current.value = '';
  }

  // ─── CSV Import Handlers ───
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportError('');
    setParsedRows([]);
    setExistingSkus([]);
    setConflictAction(null);
    setImportProgress(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length === 0) {
          setImportError('File is empty.');
          return;
        }

        // Normalize keys to lowercase for easier access
        const normalizedData = data.map((row: any) => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            newRow[key.toLowerCase().trim()] = row[key];
          });
          return newRow;
        });

        // Extract SKUs
        const skus = normalizedData.map(r => String(r.sku || '')).filter(Boolean);
        if (skus.length === 0) {
          setImportError('No SKUs found in the file.');
          return;
        }

        setParsedRows(normalizedData);
        setImporting(true);

        // Pre-flight check
        const res = await fetch(`${API}/import/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ skus }),
        });

        if (!res.ok) throw new Error('Failed to analyze SKUs');
        const { existingSkus } = await res.json();
        
        setExistingSkus(existingSkus);
        if (existingSkus.length > 0) {
          setConflictAction('pending');
        } else {
          startImportLoop(normalizedData, existingSkus, 'none');
        }
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse file');
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  }

  async function startImportLoop(rows: any[], existing: string[], action: 'skip' | 'override' | 'none') {
    setConflictAction(null);
    const progress = {
      total: rows.length, processed: 0, created: 0, updated: 0, skipped: 0, errors: 0,
      missingImages: [] as any[], errorList: [] as any[]
    };
    setImportProgress({ ...progress });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sku = String(row.sku || '');
      
      if (!sku) {
        progress.errors++;
        progress.errorList.push({ row: i + 2, sku: 'Unknown', error: 'Missing SKU' });
        progress.processed++;
        setImportProgress({ ...progress });
        continue;
      }

      if (existing.includes(sku) && action === 'skip') {
        progress.skipped++;
        progress.processed++;
        setImportProgress({ ...progress });
        continue;
      }

      try {
        const res = await fetch(`${API}/import/single`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ rowData: row, override: action === 'override' }),
        });

        const data = await res.json();
        if (!res.ok || data.status === 'error') {
          progress.errors++;
          progress.errorList.push({ row: i + 2, sku, error: data.error || 'Server error' });
        } else {
          if (data.status === 'created') progress.created++;
          if (data.status === 'updated') progress.updated++;
          if (data.status === 'skipped') progress.skipped++;
          
          if (data.missingImages && data.missingImages.length > 0) {
            data.missingImages.forEach((img: string) => {
              progress.missingImages.push({ row: i + 2, sku, filename: img });
            });
          }
        }
      } catch (err: any) {
        progress.errors++;
        progress.errorList.push({ row: i + 2, sku, error: err.message });
      }

      progress.processed++;
      setImportProgress({ ...progress });
    }
    
    setImporting(false);
    if (csvRef.current) csvRef.current.value = '';
    setCsvFileName('');
  }

  function downloadTemplate() {
    const headers = [
      'SKU', 'Product Name', 'Barcode', 'Category', 'Sub Category', 'Brand',
      'MRP', 'Selling Price', 'Cost Price', 'GST', 'Stock', 'Min Stock',
      'Short Description', 'Description', 'Weight', 'Warranty', 'Return Policy',
      'Tags', 'Images', 'Status', 'Featured', 'New Arrival', 'Best Seller',
      'Trending', 'Meta Title', 'Meta Description',
    ];
    const sample = [
      'SKU001', 'Sample Product', '1234567890', 'Electronics', 'Mobile Accessories', 'Samsung',
      '999', '799', '500', '18', '50', '5',
      'A great product', 'Detailed description here...', '250', '1 Year', '7 Days Return',
      'tag1,tag2,tag3', '3827.jpg|3828.jpg', 'active', 'true', 'false', 'true',
      'false', 'Sample Product - Buy Online', 'Best price for sample product',
    ];
    const csv = [headers.join(','), sample.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'product_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadErrorReports() {
    if (!importProgress || importProgress.errorList.length === 0) return;
    
    const headers = ['Row', 'SKU', 'Error Message'];
    const rows = importProgress.errorList.map(err => 
      [err.row, `"${err.sku}"`, `"${String(err.error).replace(/"/g, '""')}"`].join(',')
    );
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_errors_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const progressPercent = mediaProgress
    ? mediaProgress.phase === 'processing'
      ? Math.round((mediaProgress.processed / mediaProgress.total) * 50)
      : 50 + Math.round((mediaProgress.uploaded / mediaProgress.total) * 50)
    : 0;

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Bulk Import</h1>
        <p className="text-sm text-gray-500 mt-1">Upload media files first, then import products via CSV</p>
      </div>

      {/* ═══════════════ STEP 1: BULK MEDIA UPLOAD ═══════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center font-bold text-sm">1</div>
          <div>
            <h2 className="font-bold text-gray-900">Upload Media</h2>
            <p className="text-xs text-gray-500">Select images (any format, 10K+ supported). Auto-converted to WebP.</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <label
            className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-400 transition-colors cursor-pointer"
            htmlFor="media-input"
          >
            <p className="text-3xl mb-2">🖼️</p>
            {mediaFiles.length > 0 ? (
              <p className="text-sm font-semibold text-violet-600">{mediaFiles.length.toLocaleString()} images selected</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 font-medium">Click to select images</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, BMP, GIF, TIFF, AVIF — any format</p>
              </>
            )}
            <input
              ref={mediaRef}
              id="media-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleMediaSelect}
            />
          </label>

          {mediaProgress && mediaProgress.phase !== 'done' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {mediaProgress.phase === 'processing'
                    ? `Processing ${mediaProgress.processed.toLocaleString()} / ${mediaProgress.total.toLocaleString()}`
                    : `Uploading ${mediaProgress.uploaded.toLocaleString()} / ${mediaProgress.total.toLocaleString()}`}
                </span>
                <span className="font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {mediaProgress.phase === 'processing' ? 'Converting to WebP & stripping metadata...' : 'Uploading to cloud storage...'}
              </p>
            </div>
          )}

          {mediaResult && (
            <div className="flex gap-3">
              <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">{mediaResult.uploaded.toLocaleString()}</p>
                <p className="text-[11px] font-medium text-emerald-600">Uploaded</p>
              </div>
              {mediaResult.failed > 0 && (
                <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-700">{mediaResult.failed.toLocaleString()}</p>
                  <p className="text-[11px] font-medium text-red-600">Skipped</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={startMediaUpload}
            disabled={mediaFiles.length === 0 || (mediaProgress !== null && mediaProgress.phase !== 'done')}
            className="w-full bg-violet-600 text-white py-3 rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {mediaProgress && mediaProgress.phase !== 'done'
              ? 'Processing...'
              : `Process & Upload${mediaFiles.length > 0 ? ` (${mediaFiles.length.toLocaleString()} files)` : ''}`}
          </button>
        </div>
      </div>

      {/* ═══════════════ STEP 2: CSV IMPORT ═══════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">2</div>
          <div>
            <h2 className="font-bold text-gray-900">Import Products (CSV / Excel)</h2>
            <p className="text-xs text-gray-500">Use pipe-separated filenames in the Images column</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Column format:</p>
            <p className="font-mono text-[11px] bg-blue-100 p-2 rounded overflow-x-auto">
              SKU, Product Name, Barcode, Category, Sub Category, Brand, MRP, Selling Price, Cost Price, GST, Stock, Min Stock, Short Description, Description, Weight, Warranty, Return Policy, Tags, Images, Status, Featured, New Arrival, Best Seller, Trending, Meta Title, Meta Description
            </p>
            <p>• <strong>Images:</strong> pipe-separated filenames: <code className="bg-blue-100 px-1 rounded">3827.jpg|3828.jpg</code></p>
            <p>• <strong>Category/Brand:</strong> auto-created if not found</p>
          </div>

          <label
            htmlFor="csv-input"
            className={`block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors ${importing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          >
            <p className="text-3xl mb-2">📊</p>
            {csvFileName
              ? <p className="text-sm font-semibold text-blue-600">{csvFileName}</p>
              : <>
                  <p className="text-sm text-gray-600 font-medium">Upload Excel (.xlsx) or CSV</p>
                  <p className="text-xs text-gray-400 mt-1">Click to choose file</p>
                </>}
            <input
              ref={csvRef}
              id="csv-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
              disabled={importing}
            />
          </label>

          {importError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{importError}</p>}
          
          <button
            type="button"
            onClick={downloadTemplate}
            className="w-full border border-gray-200 px-4 py-3 rounded-lg text-sm hover:bg-gray-50 font-medium text-gray-700"
          >
            ⬇ Download Template
          </button>

          {/* Conflict Resolution UI */}
          {conflictAction === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 space-y-4">
              <div>
                <p className="font-bold text-amber-800 text-lg">⚠️ Found {existingSkus.length} existing products</p>
                <p className="text-sm text-amber-700 mt-1">Some SKUs in your file already exist in the database. How would you like to handle them?</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startImportLoop(parsedRows, existingSkus, 'skip')} className="flex-1 bg-white border border-amber-300 text-amber-800 py-2.5 rounded-lg font-semibold hover:bg-amber-100 transition-colors text-sm shadow-sm">
                  Skip All
                </button>
                <button onClick={() => startImportLoop(parsedRows, existingSkus, 'override')} className="flex-1 bg-amber-600 text-white py-2.5 rounded-lg font-semibold hover:bg-amber-700 transition-colors text-sm shadow-sm">
                  Override All
                </button>
              </div>
            </div>
          )}

          {/* Import Progress & Results */}
          {importProgress && (
            <div className="border border-gray-100 rounded-xl p-5 space-y-5 bg-white shadow-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
                  <span>Uploading {importProgress.processed} of {importProgress.total}</span>
                  <span>{Math.round((importProgress.processed / importProgress.total) * 100)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 text-emerald-700 rounded-lg p-3 text-center border border-emerald-100">
                  <p className="text-2xl font-bold">{importProgress.created}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Created</p>
                </div>
                <div className="bg-blue-50 text-blue-700 rounded-lg p-3 text-center border border-blue-100">
                  <p className="text-2xl font-bold">{importProgress.updated}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Updated</p>
                </div>
                <div className="bg-yellow-50 text-yellow-700 rounded-lg p-3 text-center border border-yellow-100">
                  <p className="text-2xl font-bold">{importProgress.skipped}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Skipped</p>
                </div>
                <div className="bg-red-50 text-red-700 rounded-lg p-3 text-center border border-red-100">
                  <p className="text-2xl font-bold">{importProgress.errors}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Errors</p>
                </div>
              </div>

              {importProgress.errorList.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 space-y-3 border border-red-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                      <span>❌</span> Row Errors:
                    </p>
                    {importProgress.errorList.length > 1 && (
                      <button 
                        onClick={downloadErrorReports}
                        className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors shadow-sm flex items-center gap-1"
                      >
                        ⬇ Download Report
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {importProgress.errorList.map((r: any, i: number) => (
                      <p key={i} className="text-xs text-red-600 font-medium bg-red-100/50 p-2 rounded">
                        <span className="font-bold text-red-700">Row {r.row} ({r.sku}):</span> {r.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {importProgress.missingImages.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto border border-amber-200">
                  <p className="text-sm font-bold text-amber-700 flex items-center gap-1.5">
                    <span>⚠️</span> Missing Images ({importProgress.missingImages.length})
                  </p>
                  <p className="text-[11px] text-amber-600">These products were created/updated but the listed images were not found:</p>
                  <div className="space-y-1">
                    {importProgress.missingImages.map((m: any, i: number) => (
                      <p key={i} className="text-xs text-amber-700 font-mono">
                        Row {m.row} • <span className="font-semibold">{m.sku}</span> → <code className="bg-amber-100 px-1 rounded">{m.filename}</code>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
