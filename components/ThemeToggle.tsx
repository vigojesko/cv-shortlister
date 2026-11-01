"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    setDark(document.documentElement.classList.contains("dark"));
    const change = () => {
      if (!localStorage.getItem("cv-theme")) {
        setDark(media.matches);
        document.documentElement.classList.toggle("dark", media.matches);
      }
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return (
    <button
      aria-label={dark ? "Gunakan tema terang" : "Gunakan tema gelap"}
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem("cv-theme", next ? "dark" : "light");
        } catch {}
      }}
      className="rounded-lg p-2 hover:bg-muted"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
