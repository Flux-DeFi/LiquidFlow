"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full bg-glass-border animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-glass-border bg-glass backdrop-blur-sm text-foreground transition-all duration-200 hover:bg-glass-highlight hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Sun
        className={`h-4 w-4 transition-all duration-300 ${isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          }`}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-300 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
          }`}
      />
    </button>
  );
}
