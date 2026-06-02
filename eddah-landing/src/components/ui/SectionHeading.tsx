"use client";

import { motion } from "framer-motion";
import { fadeUp, fadeUpSmall, inViewProps, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={inViewProps.viewport}
      className={cn(
        "flex max-w-2xl flex-col gap-5",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <motion.span variants={fadeUpSmall} className="eyebrow">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        {eyebrow}
      </motion.span>
      <motion.h2
        variants={fadeUp}
        className="text-balance text-3xl font-bold leading-[1.12] tracking-tightest text-ink md:text-[44px]"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          variants={fadeUp}
          className="text-pretty text-[17px] leading-relaxed text-ink-500"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
