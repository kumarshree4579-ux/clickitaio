'use client';
import { useEffect, useRef, useState } from 'react';


const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token');
const empty = { title: '', slug: '', content: '', metaTitle: '', metaDescription: '', isActive: true };

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Set initial content only once
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      isInternalUpdate.current = true;
      ref.current.innerHTML = value;
      isInternalUpdate.current = false;
    }
  }, [value]);

  function exec(cmd: string, val?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function handleInput() {
    if (!isInternalUpdate.current && ref.current) onChange(ref.current.innerHTML);
  }

  const btn = (label: string, cmd: string, val?: string, title?: string) => (
    <button type="button" title={title || label} onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
      className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 font-medium transition-colors">
      {label}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {btn('B', 'bold')}
        {btn('I', 'italic')}
        {btn('U', 'underline')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {btn('H1', 'formatBlock', '<h1>', 'Heading 1')}
        {btn('H2', 'formatBlock', '<h2>', 'Heading 2')}
        {btn('H3', 'formatBlock', '<h3>', 'Heading 3')}
        {btn('P', 'formatBlock', '<p>', 'Paragraph')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {btn('• List', 'insertUnorderedList')}
        {btn('1. List', 'insertOrderedList')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        {btn('" Quote', 'formatBlock', '<blockquote>', 'Blockquote')}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button type="button" title="Insert Link" onMouseDown={e => {
          e.preventDefault();
          const url = prompt('Enter URL:');
          if (url) exec('createLink', url);
        }} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 transition-colors">🔗</button>
        <button type="button" title="Remove Link" onMouseDown={e => { e.preventDefault(); exec('unlink'); }}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-700 transition-colors">🔗✕</button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button type="button" title="Clear formatting" onMouseDown={e => { e.preventDefault(); exec('removeFormat'); }}
          className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-500 transition-colors">✕ Format</button>
      </div>
      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[280px] p-4 text-sm text-gray-800 focus:outline-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:border-b [&_h2]:pb-1
          [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3
          [&_p]:mb-3 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3
          [&_a]:text-blue-600 [&_a]:underline
          [&_strong]:font-bold"
      />
    </div>
  );
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'visual' | 'html'>('visual');

  async function load() {
    const data = await fetch(`${API}/pages`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
    setPages(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load(); }, []);

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function save() {
    const url = editing ? `${API}/pages/${editing}` : `${API}/pages`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const e = await res.json(); alert(e.error); return; }
    setForm(empty); setEditing(null); setShowForm(false); load();
  }

  async function del(id: string) {
    if (!confirm('Delete page?')) return;
    await fetch(`${API}/pages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  function openEdit(p: any) {
    setForm(p); setEditing(p._id); setShowForm(true); setTab('visual');
  }

  function openNew() {
    setForm(empty); setEditing(null); setShowForm(true); setTab('visual');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">CMS Pages</h1>
        <button onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ New Page</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">{editing ? 'Edit' : 'New'} Page</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input placeholder="e.g. About Us" value={form.title}
                onChange={e => setForm((f: any) => ({ ...f, title: e.target.value, slug: editing ? f.slug : autoSlug(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
              <input placeholder="e.g. about, privacy, faq" value={form.slug}
                onChange={e => setForm((f: any) => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          {/* Editor tabs */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <label className="text-xs font-medium text-gray-600 mr-2">Content</label>
              <button onClick={() => setTab('visual')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${tab === 'visual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Visual
              </button>
              <button onClick={() => setTab('html')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${tab === 'html' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                HTML
              </button>
            </div>
            {tab === 'visual'
              ? <RichEditor value={form.content} onChange={v => setForm((f: any) => ({ ...f, content: v }))} />
              : <textarea value={form.content}
                  onChange={e => setForm((f: any) => ({ ...f, content: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 min-h-[280px]" />
            }
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title (SEO)</label>
              <input placeholder="SEO title" value={form.metaTitle}
                onChange={e => setForm((f: any) => ({ ...f, metaTitle: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description (SEO)</label>
              <input placeholder="SEO description" value={form.metaDescription}
                onChange={e => setForm((f: any) => ({ ...f, metaDescription: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={save} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 font-medium">Save Page</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-200 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            {editing && (
              <a href={`${API}/pages/${form.slug}`} target="_blank"
                className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1">
                Preview ↗
              </a>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">URL</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {pages.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.slug}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <a href={`${API}/pages/${p.slug}`} target="_blank"
                    className="text-blue-600 hover:underline text-xs">/pages/{p.slug}</a>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                    <button onClick={() => del(p._id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">No pages yet. Create your first page.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
