export default function CategoriesLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-9 sm:py-6">
      {/* Title skeleton */}
      <div className="h-6 w-40 bg-gray-200 rounded mb-6 animate-pulse" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-2 animate-pulse">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gray-100" />
            <div className="h-3 w-14 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
