import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored;
      
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-[9999] flex h-11 w-11 items-center justify-center rounded-full bg-white/95 dark:bg-gray-900/95 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      aria-label="Toggle Theme"
      id="floating-theme-toggle"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-gray-650 transition-transform duration-300 hover:rotate-12" />
      ) : (
        <Sun className="h-5 w-5 text-amber-500 transition-transform duration-500 hover:rotate-45" />
      )}
    </button>
  );
}
