"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="w-9 h-9 rounded-full flex items-center justify-center border border-border/60 bg-background/50 text-muted-foreground transition-colors hover:text-foreground hover:border-brand-cyan/50"
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <button
      onClick={cycleTheme}
      title={
        theme === "dark"
          ? "Switch to Light Mode"
          : theme === "light"
          ? "Switch to System Theme"
          : "Switch to Dark Mode"
      }
      aria-label="Toggle theme"
      className="relative w-9 h-9 rounded-full flex items-center justify-center border border-border/60 bg-background/60 backdrop-blur-md text-foreground transition-all duration-300 hover:border-brand-cyan hover:shadow-[0_0_15px_rgba(20,184,196,0.25)] hover:scale-105 active:scale-95"
    >
      {theme === "dark" ? (
        <Moon className="w-4 h-4 text-brand-cyan transition-transform duration-300 rotate-0 scale-100" />
      ) : theme === "light" ? (
        <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Laptop className="w-4 h-4 text-brand-blue transition-transform duration-300" />
      )}
    </button>
  );
}
