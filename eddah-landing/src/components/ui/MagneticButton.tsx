"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "whatsapp";

const styles: Record<Variant, string> = {
  primary:
    "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-glow",
  ghost:
    "bg-white text-ink border border-clay-200 hover:border-orange-300 hover:text-orange-600 shadow-soft",
  whatsapp:
    "bg-[#1f8a4c] text-white hover:bg-[#23a058] shadow-[0_18px_44px_-18px_rgba(31,138,76,0.6)]",
};

/**
 * MagneticButton — the CTA primitive. The label is gently pulled toward the
 * cursor for a tactile, high-end hover. Renders as <a> when href is given.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  className,
  icon,
  target,
  rel,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  icon?: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setPos({ x: x * 0.25, y: y * 0.3 });
  };

  const reset = () => setPos({ x: 0, y: 0 });

  const inner = (
    <motion.span
      className="relative z-10 flex items-center gap-2.5"
      animate={{ x: pos.x * 0.4, y: pos.y * 0.4 }}
      transition={{ type: "spring", stiffness: 250, damping: 18, mass: 0.4 }}
    >
      {icon}
      {children}
    </motion.span>
  );

  const base = cn(
    "group relative inline-flex select-none items-center justify-center overflow-hidden rounded-full px-7 py-3.5 text-[15px] font-semibold tracking-tight transition-colors duration-300",
    styles[variant],
    className,
  );

  const motionProps = {
    ref,
    onMouseMove: handleMove,
    onMouseLeave: reset,
    animate: { x: pos.x, y: pos.y },
    transition: { type: "spring" as const, stiffness: 200, damping: 15, mass: 0.5 },
  };

  if (href) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <a href={href} onClick={onClick} target={target} rel={rel} className={base}>
          {inner}
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div {...motionProps} className="inline-block">
      <button onClick={onClick} className={base}>
        {inner}
      </button>
    </motion.div>
  );
}
