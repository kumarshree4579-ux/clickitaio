import Header from '../../../components/Header';
import Link from 'next/link';
import API from '../../../lib/api';
import InfiniteProducts from './InfiniteProducts';
import ReloadButton from '../../../components/ReloadButton';

async function getCategories() {
  try {
    const res = await fetch(`${API}/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function CategoryDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ sub?: string }>
}) {
  const p = await params;
  const sp = await searchParams;
  const mainCategoryId = p.id;

  const categories = await getCategories();

  if (!categories || categories.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="h-[146px] sm:h-16 shrink-0" />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-5">
            <span className="text-4xl">🗂️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Categories Found</h2>
          <p className="text-gray-500 mb-6 max-w-md">We couldn't load the categories right now. The server might be busy or unreachable.</p>
          <ReloadButton label="Reload Categories" />
        </main>
      </div>
    );
  }

  const mainCategory = categories.find((c: any) => c._id === mainCategoryId);
  const subCategories = categories.filter((c: any) =>
    c.parent === mainCategoryId || (c.parent && c.parent._id === mainCategoryId)
  );

  const activeSubId = sp.sub || null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="h-[146px] sm:h-16 shrink-0" />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-0">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 overflow-x-auto scrollbar-hide whitespace-nowrap">
            <Link href="/" className="hover:text-indigo-600 shrink-0">Home</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-indigo-600 shrink-0">Categories</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium shrink-0">{mainCategory?.name || 'Category'}</span>
          </nav>
        </div>
      </div>

      <main className="w-full max-w-[1600px] mx-auto bg-gray-50 flex flex-row min-h-[calc(100vh-187px)] sm:min-h-[calc(100vh-109px)]">

        {/* Subcategory Sidebar (25% on mobile) */}
        <aside className="w-1/4 lg:w-1/5 bg-white border-r border-gray-100 shrink-0 overflow-y-auto scrollbar-hide h-[calc(100vh-187px)] sm:h-[calc(100vh-109px)]">
          <div className="py-2">
            <Link
              href={`/categories/${mainCategoryId}`}
              className={`flex flex-col items-center justify-center p-2 sm:px-5 sm:py-4 text-xs sm:text-sm font-medium border-l-[3px] sm:border-l-4 transition-colors ${!activeSubId
                ? 'border-[var(--color-primary)] bg-indigo-50/50 text-[var(--color-primary)]'
                : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-100 mb-2 border border-gray-200 flex items-center justify-center shrink-0">
                {mainCategory?.image ? (
                  <img src={mainCategory.image} alt="All" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 text-sm sm:text-base font-bold">All</span>
                )}
              </div>
              <span className="text-center text-xs sm:text-sm font-medium leading-tight break-words">All</span>
            </Link>

            {subCategories.map((sub: any) => {
              const isActive = activeSubId === sub._id;
              return (
                <Link
                  key={sub._id}
                  href={`/categories/${mainCategoryId}?sub=${sub._id}`}
                  className={`flex flex-col items-center justify-center p-2 sm:px-5 sm:py-4 text-xs sm:text-sm font-medium border-l-[3px] sm:border-l-4 transition-colors ${isActive
                    ? 'border-[var(--color-primary)] bg-indigo-50/50 text-[var(--color-primary)]'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-100 mb-2 shrink-0 border border-gray-200 flex items-center justify-center">
                    {sub.image ? (
                      <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm font-bold uppercase">{sub.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-center text-xs sm:text-sm font-medium leading-tight break-words w-full">{sub.name}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Right Pane (75% on mobile) */}
        <div className="flex-1 w-3/4 lg:w-4/5 overflow-y-auto h-[calc(100vh-187px)] sm:h-[calc(100vh-109px)]">
          <div className="p-2 sm:p-6 pb-20 sm:pb-6">
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <h2 className="text-sm sm:text-lg font-bold text-gray-800">
                {!activeSubId ? 'All Products' : subCategories.find((c: any) => c._id === activeSubId)?.name}
              </h2>
            </div>
            <InfiniteProducts
              categoryId={mainCategoryId}
              subCategoryId={activeSubId}
            />
          </div>
        </div>

      </main>
    </div>
  );
}
