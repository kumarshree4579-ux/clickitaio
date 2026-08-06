import Header from '../../../components/Header';
import { notFound } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getPage(slug: string) {
  try {
    const res = await fetch(`${API}/pages/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);
  if (!page) notFound();

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{page.title}</h1>
        <div
          className="bg-white rounded-xl shadow-sm p-6 text-sm leading-relaxed text-gray-700 space-y-4"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </main>
    </>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);
  return {
    title: page?.metaTitle || page?.title || 'Page',
    description: page?.metaDescription || '',
  };
}
