export function TransactionsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex h-[88px] animate-pulse items-center gap-5 rounded-2xl bg-muted/50 px-5"
        >
          <div className="size-12 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
          <div className="space-y-2 text-right">
            <div className="ml-auto h-6 w-24 rounded bg-muted" />
            <div className="ml-auto h-4 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
