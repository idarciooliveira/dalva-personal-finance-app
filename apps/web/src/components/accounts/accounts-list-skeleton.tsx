export function AccountsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex h-[72px] animate-pulse items-center gap-4 rounded-lg bg-muted/50 px-4"
        >
          <div className="size-10 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
