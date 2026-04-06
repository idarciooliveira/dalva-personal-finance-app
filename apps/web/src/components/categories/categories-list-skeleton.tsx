export function CategoriesListSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-12 w-44 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="h-[88px] animate-pulse rounded-2xl bg-muted/50" />
        </div>
      ))}
    </div>
  );
}
