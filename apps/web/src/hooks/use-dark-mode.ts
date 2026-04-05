import { useCallback, useState } from "react";

/**
 * Unified dark mode hook.
 *
 * Reads the current theme from the DOM (safe for SSR), provides a toggle
 * function that updates both the `<html>` class and `localStorage`, and
 * keeps a reactive `isDark` boolean in sync.
 */
export function useDarkMode() {
  // Initialize from DOM synchronously to avoid a flash of wrong theme.
  // During SSR, `document` is undefined so we fall back to `false`.
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }, []);

  return { isDark, toggle };
}
