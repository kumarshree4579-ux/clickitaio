import Header from '../../components/Header';
import Link from 'next/link';
import API from '../../lib/api';

async function getCategories() {
  try {
    const res = await fetch(`${API}/categories`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
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
      {/* Spacer: mobile ~146px (tabs not shown on /categories), desktop 64px */}
      <div className="h-[56px] sm:h-16 shrink-0" />
      <main className="w-full px-3 sm:px-6 lg:px-8 py-4 pb-20 sm:py-6 sm:pb-6 max-w-4xl mx-auto">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 px-0.5 sm:px-1">Shop by Category</h1>
        
        {mainCategories.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-4">
            {mainCategories.map((cat: any) => (
              <Link 
                key={cat._id} 
                href={`/categories/${cat._id}`}
                className="flex flex-col items-center gap-1.5 sm:gap-2 group p-1.5 sm:p-2 hover:bg-gray-50 rounded-2xl transition-colors"
              >
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-100 border border-gray-150 shadow-sm group-hover:shadow-md transition-all group-hover:border-[var(--color-primary)]">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl sm:text-3xl">📦</div>
                  )}
                </div>
                <span className="text-[10px] sm:text-sm font-medium text-gray-700 text-center leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            No categories found.
          </div>
        )}
      </main>
    </>
  );
}
