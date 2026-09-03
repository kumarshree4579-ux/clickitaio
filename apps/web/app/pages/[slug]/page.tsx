import Header from '../../../components/Header';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import API from '../../../lib/api';

async function getPage(slug: string) {
  try {
    const res = await fetch(`${API}/pages/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

const PAGE_META: Record<string, { icon: string; gradient: string; desc: string }> = {
  about:    { icon: '🏢', gradient: 'from-indigo-600 via-violet-600 to-purple-700',   desc: 'Learn more about us' },
  privacy:  { icon: '🔒', gradient: 'from-slate-700 via-slate-600 to-slate-800',      desc: 'How we handle your data' },
  terms:    { icon: '📋', gradient: 'from-blue-600 via-blue-700 to-indigo-700',       desc: 'Terms & conditions of use' },
  contact:  { icon: '📬', gradient: 'from-emerald-600 via-teal-600 to-cyan-700',      desc: 'Get in touch with us' },
  shipping: { icon: '🚚', gradient: 'from-orange-500 via-amber-500 to-yellow-500',    desc: 'Delivery & shipping info' },
  returns:  { icon: '↩️', gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',      desc: 'Return & refund policy' },
  refund:   { icon: '💳', gradient: 'from-rose-500 via-pink-600 to-red-600',          desc: 'Refund policy details' },
  faq:      { icon: '❓', gradient: 'from-violet-600 via-purple-600 to-indigo-700',   desc: 'Frequently asked questions' },
};

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const meta = PAGE_META[slug] || { icon: '📄', gradient: 'from-indigo-600 via-violet-600 to-purple-700', desc: '' };

  return (
    <>

      <main className="min-h-screen bg-gray-50">

        {/* Hero banner */}
        <div className={`bg-gradient-to-br ${meta.gradient} relative overflow-hidden`}>
          <div className="absolute inset-0">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
          </div>
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-6">
              <Link href="/" className="text-white/60 hover:text-white transition-colors">Home</Link>
              <span className="text-white/30">/</span>
              <span className="text-white/90">{page.title}</span>
            </nav>
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0">
                {meta.icon}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  {page.title}
                </h1>
                {meta.desc && <p className="text-white/70 text-sm sm:text-base mt-1">{meta.desc}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 pb-20 sm:py-12 sm:pb-12">
          <div className="max-w-3xl">
            <article
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10
                [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-3
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-gray-100
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mt-5 [&_h3]:mb-2
                [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-sm sm:[&_p]:text-base
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1.5 [&_ul]:text-gray-600 [&_ul]:text-sm sm:[&_ul]:text-base
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1.5 [&_ol]:text-gray-600 [&_ol]:text-sm sm:[&_ol]:text-base
                [&_li]:leading-relaxed
                [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-400 [&_blockquote]:bg-primary-light [&_blockquote]:rounded-r-xl [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:my-5 [&_blockquote]:text-indigo-800 [&_blockquote]:italic
                [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-indigo-800
                [&_strong]:font-semibold [&_strong]:text-gray-800
                [&_hr]:border-gray-100 [&_hr]:my-6
                [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:mb-4
                [&_th]:bg-gray-50 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-700 [&_th]:border [&_th]:border-gray-200
                [&_td]:px-4 [&_td]:py-2 [&_td]:border [&_td]:border-gray-200 [&_td]:text-gray-600
                [&_code]:bg-gray-100 [&_code]:text-primary-dark [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />

            {/* Footer nav */}
            <div className="mt-6 flex items-center justify-between">
              <Link href="/"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {['privacy', 'terms', 'shipping', 'returns'].filter(s => s !== slug).slice(0, 2).map(s => (
                  <Link key={s} href={`/pages/${s}`} className="hover:text-primary capitalize transition-colors">
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  return {
    title: page?.metaTitle || page?.title || 'Page',
    description: page?.metaDescription || '',
  };
}
