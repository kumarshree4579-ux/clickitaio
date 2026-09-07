import Header from '../../components/Header';
import API from '../../lib/api';
import ReloadButton from '../../components/ReloadButton';
import ScrollSpyLayout from './ScrollSpyLayout';

async function getCategories() {
  try {
    const res = await fetch(`${API}/categories`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  // Main categories are those without a parent
  const mainCategories = categories.filter((c: any) => !c.parent);

  return (
    <>
      <Header />
      {mainCategories.length > 0 ? (
        <ScrollSpyLayout categories={mainCategories} />
      ) : (
        <main className="w-full px-3 sm:px-6 lg:px-8 py-9 max-w-4xl mx-auto text-center">
          <ReloadButton message="No categories found or failed to load." />
        </main>
      )}
    </>
  );
}
