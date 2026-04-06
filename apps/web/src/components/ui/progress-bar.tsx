import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** Percentage filled (0-100). Clamped to 100 max. */
  percent: number;
  /** Tailwind background color class for the filled bar. */
  barColor?: string;
  /** Additional classes for the outer track. */
  className?: string;
}

/**
 * Simple horizontal progress bar.
 * Renders a rounded track with a colored inner bar.
 */
export function ProgressBar({
  percent,
  barColor = "bg-primary",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <div
      className={cn(
        "h-4 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", barColor)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
