"use client";

import { useEffect, useRef } from "react";

/**
 * سديم — خلفية ناعمة متحركة، لها لوحتان حسب الوضع:
 *  • نهاري: سحب كهرمانية/ذهبية فوق العاجي (source-over، خفيفة).
 *  • مسائي: نيبولا بنفسجي خافت فوق الأسود (مزج إضافي lighter، أخف).
 * تُرسم بدقة منخفضة وتُنعّم بـ CSS blur. تحترم prefers-reduced-motion
 * وتتوقف عند إخفاء التبويب. تتبدّل فورًا عند تغيير الوضع.
 */

type Cloud = {
  rgb: string;
  r: number;
  peak: number;
  bx: number;
  by: number;
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  px: number;
  py: number;
};

const DAY: Cloud[] = [
  { rgb: "246,167,0", r: 0.62, peak: 0.5, bx: 0.8, by: 0.1, ax: 0.05, ay: 0.07, sx: 0.00022, sy: 0.00017, px: 0.0, py: 1.2 },
  { rgb: "242,130,12", r: 0.46, peak: 0.42, bx: 0.14, by: 0.32, ax: 0.07, ay: 0.05, sx: 0.00018, sy: 0.00024, px: 2.1, py: 0.4 },
  { rgb: "255,199,77", r: 0.58, peak: 0.46, bx: 0.52, by: 0.82, ax: 0.08, ay: 0.05, sx: 0.00015, sy: 0.0002, px: 4.0, py: 3.0 },
  { rgb: "221,106,11", r: 0.36, peak: 0.32, bx: 0.92, by: 0.72, ax: 0.05, ay: 0.07, sx: 0.00024, sy: 0.00019, px: 1.0, py: 2.0 },
  { rgb: "255,221,150", r: 0.5, peak: 0.4, bx: 0.32, by: 0.04, ax: 0.06, ay: 0.06, sx: 0.0002, sy: 0.00016, px: 5.2, py: 4.1 },
];

const NIGHT: Cloud[] = [
  { rgb: "124,77,255", r: 0.6, peak: 0.5, bx: 0.78, by: 0.12, ax: 0.05, ay: 0.07, sx: 0.00022, sy: 0.00017, px: 0.0, py: 1.2 },
  { rgb: "157,108,255", r: 0.46, peak: 0.45, bx: 0.16, by: 0.34, ax: 0.07, ay: 0.05, sx: 0.00018, sy: 0.00024, px: 2.1, py: 0.4 },
  { rgb: "190,120,255", r: 0.54, peak: 0.4, bx: 0.52, by: 0.82, ax: 0.08, ay: 0.05, sx: 0.00015, sy: 0.0002, px: 4.0, py: 3.0 },
  { rgb: "214,93,177", r: 0.34, peak: 0.35, bx: 0.92, by: 0.7, ax: 0.05, ay: 0.07, sx: 0.00024, sy: 0.00019, px: 1.0, py: 2.0 },
  { rgb: "150,110,255", r: 0.48, peak: 0.42, bx: 0.34, by: 0.06, ax: 0.06, ay: 0.06, sx: 0.0002, sy: 0.00016, px: 5.2, py: 4.1 },
];

export function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;

    const isNight = () => document.documentElement.getAttribute("data-theme") === "night";

    const resize = () => {
      const longSide = Math.max(window.innerWidth, window.innerHeight);
      const scale = Math.min(0.28, 460 / longSide);
      w = Math.max(1, Math.round(window.innerWidth * scale));
      h = Math.max(1, Math.round(window.innerHeight * scale));
      canvas.width = w;
      canvas.height = h;
    };

    const draw = (t: number) => {
      const night = isNight();
      const clouds = night ? NIGHT : DAY;
      const base = Math.min(w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = night ? "lighter" : "source-over";

      for (const c of clouds) {
        const x = (c.bx + Math.sin(t * c.sx + c.px) * c.ax) * w;
        const y = (c.by + Math.cos(t * c.sy + c.py) * c.ay) * h;
        const radius = c.r * base;
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, `rgba(${c.rgb},${c.peak})`);
        g.addColorStop(0.5, `rgba(${c.rgb},${c.peak * 0.4})`);
        g.addColorStop(1, `rgba(${c.rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // الشدة تختلف بين الوضعين
      canvas.style.opacity = night ? "0.42" : "0.72";
    };

    const loop = (t: number) => {
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduce) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    // عند تبديل الوضع وفي حالة reduced-motion نعيد رسم إطار ثابت
    const onTheme = () => draw(6000);
    window.addEventListener("themechange", onTheme);

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduce) draw(6000);
    else raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("themechange", onTheme);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{
          filter: "blur(62px) saturate(120%)",
          opacity: 0.72,
          transform: "scale(1.16)",
          transformOrigin: "center",
        }}
      />
    </div>
  );
}
