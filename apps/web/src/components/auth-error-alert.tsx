import { AlertCircle, X } from "lucide-react";

interface AuthErrorAlertProps {
  /** The error message to display. Renders nothing if null/undefined. */
  message: string | null | undefined;
  /** Optional callback to dismiss the alert. */
  onDismiss?: () => void;
}

/**
 * Displays an auth error message in a styled alert box.
 * Renders nothing when `message` is falsy.
 */
export function AuthErrorAlert({ message, onDismiss }: AuthErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p className="flex-1 text-sm text-destructive">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 text-destructive/60 transition-colors hover:text-destructive"
          aria-label="Dismiss error"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
