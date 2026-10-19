import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "infracare-theme";

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

/** App-wide dark mode toggle; remembers the choice in localStorage. */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    const initial = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(initial);
    apply(initial);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    apply(next);
    localStorage.setItem(KEY, next ? "dark" : "light");
  }

  return (
    <Button variant="ghost" className={className} onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span>{dark ? "Light" : "Dark"}</span>
    </Button>
  );
}
