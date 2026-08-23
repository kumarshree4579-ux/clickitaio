import Header from '../../../components/Header';
import Link from 'next/link';
import API from '../../../lib/api';
import InfiniteProducts from './InfiniteProducts';

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
  
  const mainCategory = categories.find((c: any) => c._id === mainCategoryId);
  const subCategories = categories.filter((c: any) => 
    c.parent === mainCategoryId || (c.parent && c.parent._id === mainCategoryId)
  );

  const activeSubId = sp.sub || null;

  return (
    <>
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 overflow-x-auto scrollbar-hide whitespace-nowrap">
            <Link href="/" className="hover:text-indigo-600 shrink-0">Home</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-indigo-600 shrink-0">Categories</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium shrink-0">{mainCategory?.name || 'Category'}</span>
          </nav>
        </div>
      </div>

      <main className="w-full max-w-[1600px] mx-auto bg-gray-50 flex" style={{ minHeight: 'calc(100vh - 96px)' }}>
        
        {/* Left Pane — subcategory sidebar */}
        <aside className="w-20 sm:w-1/4 lg:w-1/5 bg-white border-r border-gray-100 shrink-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 96px)' }}>
          <div className="py-1 sm:py-2">
            <Link 
              href={`/categories/${mainCategoryId}`}
              className={`block px-2 sm:px-5 py-2.5 sm:py-4 text-[10px] sm:text-sm font-medium border-l-3 sm:border-l-4 transition-colors ${
                !activeSubId 
                  ? 'border-[var(--color-primary)] bg-indigo-50/50 text-[var(--color-primary)]' 
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </Link>
            {subCategories.map((sub: any) => {
              const isActive = activeSubId === sub._id;
              return (
                <Link 
                  key={sub._id}
                  href={`/categories/${mainCategoryId}?sub=${sub._id}`}
                  className={`block px-2 sm:px-5 py-2.5 sm:py-4 text-[10px] sm:text-sm font-medium border-l-3 sm:border-l-4 transition-colors ${
                    isActive 
                      ? 'border-[var(--color-primary)] bg-indigo-50/50 text-[var(--color-primary)]' 
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {sub.image && (
                    <div className="sm:hidden mb-1 mx-auto w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                       <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="block text-center sm:text-left leading-tight">{sub.name}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Right Pane */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 96px)' }}>
           <div className="p-2.5 sm:p-6">
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
    </>
  );
}
