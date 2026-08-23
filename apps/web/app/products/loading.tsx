export default function ProductsLoading() {
  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Breadcrumb skeleton */}
      <div className="h-3 w-32 bg-gray-200 rounded mb-4 animate-pulse" />

      {/* Title + sort bar */}
      <div className="flex items-center justify-between mb-4 animate-pulse">
        <div className="space-y-1.5">
          <div className="h-5 w-28 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-32 bg-gray-100 rounded-lg" />
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="w-full aspect-square bg-gray-100" />
            <div className="p-2.5 sm:p-3 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-8 bg-gray-100 rounded-xl mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
