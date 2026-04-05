import { ConvexError } from "convex/values";

/* -------------------------------------------------------------------------- */
/*  Known error patterns → user-friendly messages                             */
/* -------------------------------------------------------------------------- */

const ERROR_MAP: Array<{ pattern: RegExp; message: string }> = [
  // Sign-up: account already exists
  {
    pattern: /account\s+\S+\s+already\s+exists/i,
    message: "An account with this email already exists. Try logging in instead.",
  },
  // Sign-in: invalid credentials / wrong password
  {
    pattern: /invalid.*password|wrong.*password|incorrect.*password/i,
    message: "Invalid email or password. Please try again.",
  },
  // Sign-in: account not found
  {
    pattern: /could\s+not\s+find.*account|account.*not\s+found|no\s+account/i,
    message: "No account found with this email. Check the address or sign up.",
  },
  // Password too short / validation
  {
    pattern: /password.*too\s+short|password.*at\s+least/i,
    message: "Password must be at least 8 characters long.",
  },
  // Invalid email format (server-side)
  {
    pattern: /invalid.*email/i,
    message: "Please enter a valid email address.",
  },
  // Rate limiting
  {
    pattern: /too\s+many\s+(requests|attempts)|rate\s+limit/i,
    message: "Too many attempts. Please wait a moment and try again.",
  },
  // Invalid account ID (race condition / stale session)
  {
    pattern: /InvalidAccountId/i,
    message: "Session expired or invalid. Please try again.",
  },
];

const FALLBACK_MESSAGES: Record<string, string> = {
  signIn: "Unable to sign in. Please check your credentials and try again.",
  signUp: "Unable to create account. Please try again.",
  default: "Something went wrong. Please try again.",
};

/* -------------------------------------------------------------------------- */
/*  Parser                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Extracts the meaningful error message from a raw Convex server error string.
 *
 * Convex wraps errors in noisy strings like:
 *   `[CONVEX A(auth:signIn)] [Request ID: abc123] Server Error\n
 *    Uncaught Error: Uncaught Error: Account x@y.com already exists\n
 *    at createAccountFromCredentialsImpl (...)`
 *
 * This function strips the wrapper, matches against known patterns, and
 * returns a clean user-facing message.
 */
export function parseConvexAuthError(
  error: unknown,
  flow: "signIn" | "signUp" | "default" = "default",
): string {
  // ConvexError has structured `.data`
  if (error instanceof ConvexError) {
    const data = error.data;
    if (typeof data === "string") {
      return matchOrFallback(data, flow);
    }
    if (typeof data === "object" && data !== null && "message" in data) {
      return matchOrFallback(String((data as { message: unknown }).message), flow);
    }
    return FALLBACK_MESSAGES[flow] ?? FALLBACK_MESSAGES.default;
  }

  // Regular Error — extract the innermost message from the Convex noise
  if (error instanceof Error) {
    const cleaned = extractCoreMessage(error.message);
    return matchOrFallback(cleaned, flow);
  }

  // String thrown directly
  if (typeof error === "string") {
    const cleaned = extractCoreMessage(error);
    return matchOrFallback(cleaned, flow);
  }

  return FALLBACK_MESSAGES[flow] ?? FALLBACK_MESSAGES.default;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Strip Convex envelope noise from a raw error string.
 *
 * Input:
 *   "[CONVEX A(auth:signIn)] [Request ID: abc] Server Error\n
 *    Uncaught Error: Uncaught Error: Account x@y.com already exists\n
 *    at createAccountFromCredentialsImpl (...)"
 *
 * Output:
 *   "Account x@y.com already exists"
 */
function extractCoreMessage(raw: string): string {
  // Remove stack trace lines (lines starting with "at ")
  const withoutStack = raw
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("at "))
    .join("\n");

  // Remove the [CONVEX ...] prefix and [Request ID: ...] prefix
  const withoutPrefix = withoutStack
    .replace(/\[CONVEX\s+[^\]]*\]\s*/g, "")
    .replace(/\[Request\s+ID:\s*[^\]]*\]\s*/g, "")
    .replace(/Server\s+Error\s*/gi, "");

  // Unwrap nested "Uncaught Error:" wrappers — take the last one
  const parts = withoutPrefix.split(/Uncaught\s+Error:\s*/gi);
  const innermost = parts[parts.length - 1]?.trim() ?? withoutPrefix.trim();

  return innermost || raw.trim();
}

/**
 * Try to match the cleaned message against known patterns.
 * Returns the friendly message if matched, otherwise a sanitized
 * version of the cleaned message (capped length, no stack traces).
 */
function matchOrFallback(cleaned: string, flow: string): string {
  for (const { pattern, message } of ERROR_MAP) {
    if (pattern.test(cleaned)) {
      return message;
    }
  }

  // If the cleaned message is short and looks human-readable, use it directly.
  // Otherwise fall back to a generic message.
  if (cleaned.length > 0 && cleaned.length <= 200 && !cleaned.includes("\n")) {
    return cleaned;
  }

  return FALLBACK_MESSAGES[flow] ?? FALLBACK_MESSAGES.default;
}
