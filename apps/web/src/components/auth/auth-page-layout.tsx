import { Link } from "@tanstack/react-router";

interface AuthPageLayoutProps {
  /** Page title shown in the card header */
  title: string;
  /** Subtitle text or JSX (e.g. "Already have an account? Log in") */
  subtitle?: React.ReactNode;
  /** The form and additional content inside the card */
  children: React.ReactNode;
  /** Optional content rendered below the card (e.g. legal text) */
  footer?: React.ReactNode;
}

/**
 * Shared layout for auth pages (login, register, forgot-password).
 *
 * Provides the centered container, DALVA logo link, card wrapper with
 * heading/subtitle, and an optional footer slot.
 */
export function AuthPageLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-105">
        {/* Logo */}
        <Link to="/" className="mb-10 block text-center">
          <span className="font-heading text-2xl font-semibold text-foreground">
            DALVA
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Header */}
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}

          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}
