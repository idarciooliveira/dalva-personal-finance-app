import type { LucideIcon } from "lucide-react";

interface StepHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

/**
 * Shared heading block for onboarding step cards.
 * Renders a centered icon badge, title, and subtitle.
 */
export function StepHeader({ icon: Icon, title, subtitle }: StepHeaderProps) {
  return (
    <div>
      <div className="mb-4 flex justify-center">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-wise-bright-green/15 text-wise-forest-green dark:text-wise-bright-green">
          <Icon className="size-7" />
        </div>
      </div>
      <h1 className="text-center font-heading text-2xl font-semibold text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}
