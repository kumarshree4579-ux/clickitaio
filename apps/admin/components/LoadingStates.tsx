'use client';

/**
 * Inline spinner for buttons and small areas
 */
export function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';
  return (
    <div className={`${s} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
}

/**
 * Full page centered loader
 */
export function PageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Table skeleton — mimics a data table loading
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`h-3 bg-gray-100 rounded ${c === 0 ? 'w-20' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card grid skeleton
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Single line stat skeleton
 */
export function StatsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
export function EmptyState({ icon = '📭', title = 'Nothing here', description = '' }: { icon?: string; title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
