/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-8 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="mx-auto mt-4 h-4 w-48 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
