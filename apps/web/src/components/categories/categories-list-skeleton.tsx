export function CategoriesListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-lg bg-muted/50"
        />
      ))}
    </div>
  );
}
