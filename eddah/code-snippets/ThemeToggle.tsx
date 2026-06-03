"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "eddah-theme";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

/**
 * مبدّل الوضع نهاري/مسائي. يكتب data-theme على <html>، يحفظ الاختيار،
 * ويُطلق حدث themechange لتحديث خلفية «سديم» فورًا.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [night, setNight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNight(document.documentElement.getAttribute("data-theme") === "night");
  }, []);

  const toggle = () => {
    const next = !night;
    setNight(next);
    const root = document.documentElement;
    if (next) root.setAttribute("data-theme", "night");
    else root.removeAttribute("data-theme");
    try {
      localStorage.setItem(STORAGE_KEY, next ? "night" : "day");
    } catch {}
    window.dispatchEvent(new Event("themechange"));
  };

  return (
    <button
      onClick={toggle}
      aria-label={night ? "تفعيل الوضع النهاري" : "تفعيل الوضع المسائي"}
      title={night ? "الوضع النهاري" : "الوضع المسائي"}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full border border-clay-200 bg-white/80 text-ink-600 backdrop-blur transition-colors hover:border-orange-300 hover:text-orange-600",
        className,
      )}
    >
      {mounted && night ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
    </button>
  );
}
