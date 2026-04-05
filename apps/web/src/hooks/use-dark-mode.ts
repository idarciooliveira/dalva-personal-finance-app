import { useCallback, useEffect, useState } from "react";

/**
 * Unified dark mode hook.
 *
 * Reads the current theme from the DOM (safe for SSR), provides a toggle
 * function that updates both the `<html>` class and `localStorage`, and
 * keeps a reactive `isDark` boolean in sync.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  // Sync state with the DOM on mount (SSR-safe)
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }, []);

  return { isDark, toggle };
}
