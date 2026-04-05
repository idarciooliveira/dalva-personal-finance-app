/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import schema from "./schema";

export const modules = import.meta.glob("./**/*.ts");

/**
 * Create a convex-test instance with the project schema and modules.
 */
export function setupTest() {
  return convexTest(schema, modules);
}

/**
 * Create an authenticated test accessor.
 *
 * `getAuthUserId` from `@convex-dev/auth/server` extracts the user ID
 * from `identity.subject` by splitting on `"|"`. We set `subject`
 * to `"userId|sessionId"` to match this format.
 *
 * @param t - The convex-test instance
 * @param options - Optional overrides (name, subject, etc.)
 */
export function asUser(
  t: ReturnType<typeof convexTest>,
  options: { name?: string; subject?: string } = {},
) {
  const name = options.name ?? "Test User";
  const subject = options.subject ?? "test-user-id|test-session-id";
  return t.withIdentity({ name, subject });
}
