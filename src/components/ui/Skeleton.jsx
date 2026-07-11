export function Skeleton({ className = '', as: Tag = 'div' }) {
  return <Tag className={`skeleton ${className}`} aria-hidden="true" />
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-1.5 h-6 w-28" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Skeleton className="h-9 w-9 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="mb-1.5 h-3.5 w-2/5" />
        <Skeleton className="h-2.5 w-1/4" />
      </div>
      <div className="flex flex-col items-end">
        <Skeleton className="mb-1.5 h-3.5 w-16" />
        <Skeleton className="h-2.5 w-10" />
      </div>
    </div>
  )
}

export function SkeletonChart({ height = 220 }) {
  return (
    <div className="flex items-end gap-2 px-2" style={{ height }} aria-hidden="true">
      {[45, 70, 35, 85, 55, 95, 60, 40, 75, 50, 88, 65].map((h, i) => (
        <div key={i} className="skeleton flex-1 rounded-t-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 5 }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
