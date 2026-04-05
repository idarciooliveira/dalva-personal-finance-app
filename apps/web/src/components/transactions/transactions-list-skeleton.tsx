export function TransactionsListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex h-[64px] animate-pulse items-center gap-3 rounded-lg bg-muted/50 px-4"
        >
          <div className="size-8 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          <div className="space-y-2 text-right">
            <div className="ml-auto h-4 w-20 rounded bg-muted" />
            <div className="ml-auto h-3 w-14 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
