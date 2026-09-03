export default function ProductDetailLoading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {/* Breadcrumb */}
        <div className="h-3 w-48 bg-gray-200 rounded mb-4 animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {/* Image skeleton */}
          <div className="bg-white rounded-2xl p-3 shadow-sm animate-pulse">
            <div className="w-full aspect-square bg-gray-100 rounded-xl" />
          </div>

          {/* Info skeleton */}
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-20 bg-primary-light rounded-full" />
            <div className="h-7 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/3 bg-gray-100 rounded" />
            <div className="bg-white rounded-2xl p-4 space-y-2">
              <div className="h-8 w-1/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/4 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
