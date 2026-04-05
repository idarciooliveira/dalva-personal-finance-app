import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Floating action menu -- liquid glass pill                                  */
/*  Always shows 3 icons. Hovering an icon reveals its label.                 */
/* -------------------------------------------------------------------------- */

interface ActionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface FloatingActionMenuProps {
  onAction?: (type: "income" | "expense") => void;
}

export function FloatingActionMenu({ onAction }: FloatingActionMenuProps) {
  const actions: ActionItem[] = [
    {
      key: "income",
      label: "Income",
      icon: <TrendingUp className="size-[18px] shrink-0" />,
      onClick: () => onAction?.("income"),
    },
    {
      key: "expense",
      label: "Expense",
      icon: <TrendingDown className="size-[18px] shrink-0" />,
      onClick: () => onAction?.("expense"),
    },
    {
      key: "transfer",
      label: "Transfer",
      icon: <ArrowLeftRight className="size-[18px] shrink-0" />,
      // Transfers are out of scope for now
      onClick: () => {},
    },
  ];

  return (
    /* Positioning layer -- no pointer events on the wrapper */
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-6">
      {/* Pill */}
      <div
        role="toolbar"
        aria-label="Quick actions"
        className="pointer-events-auto liquid-glass-pill flex h-12 items-center gap-1 rounded-full px-1.5"
      >
        {/* Logo */}
        <img
          src="/logo.svg"
          alt="Dalva"
          className="size-8 shrink-0 rounded-full"
        />

        <div className="h-5 w-px shrink-0 bg-foreground/10" />

        {actions.map((action, i) => (
          <div key={action.key} className="flex items-center gap-1">
            {/* Divider between action items */}
            {i > 0 && (
              <div className="h-5 w-px shrink-0 bg-foreground/10" />
            )}

            {/* Action button -- icon always visible, label on hover */}
            <button
              onClick={action.onClick}
              className={cn(
                "group/action flex items-center gap-0 rounded-full p-2.5 text-foreground",
                "transition-all duration-200 ease-out",
                "hover:bg-foreground/10 hover:gap-2 hover:px-3.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              )}
              aria-label={`Register ${action.label.toLowerCase()}`}
            >
              {action.icon}
              <span
                className={cn(
                  "max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0",
                  "transition-all duration-200 ease-out",
                  "group-hover/action:max-w-[80px] group-hover/action:opacity-100"
                )}
              >
                {action.label}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
