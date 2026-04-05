/* -------------------------------------------------------------------------- */
/*  Dashboard loading skeleton                                                */
/*  Matches the sidebar + main content layout.                                */
/* -------------------------------------------------------------------------- */

function SkeletonCard({
  className = "",
  height = "h-48",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-card ring-1 ring-foreground/10 ${height} ${className}`}
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="mt-2 h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-svh bg-background">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:block">
        <div className="flex flex-col gap-4 p-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="size-9 animate-pulse rounded-xl bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          </div>
          {/* Nav items */}
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                <div className="size-4 animate-pulse rounded bg-muted" />
                <div
                  className="h-4 animate-pulse rounded bg-muted"
                  style={{ width: `${60 + Math.random() * 40}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex h-14 items-center border-b border-border px-4 lg:px-8">
          <div className="size-7 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Content */}
        <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8">
          {/* Greeting */}
          <div className="mb-6">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
          </div>

          {/* Two column layout */}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Left */}
            <div className="flex flex-col gap-6">
              {/* Card visual */}
              <div className="aspect-[1.6/1] max-w-[320px] animate-pulse rounded-2xl bg-muted" />
              {/* Transactions */}
              <SkeletonCard height="h-72" />
            </div>
            {/* Right */}
            <div className="flex flex-col gap-6">
              <SkeletonCard height="h-80" />
              <SkeletonCard height="h-64" />
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard height="h-40" />
            <SkeletonCard height="h-40" />
            <SkeletonCard height="h-40" />
            <SkeletonCard height="h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
