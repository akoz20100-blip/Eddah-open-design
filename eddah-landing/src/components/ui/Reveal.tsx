"use client";

import { motion, type Variants } from "framer-motion";
import { fadeUp, inViewProps, staggerContainer } from "@/lib/motion";

/**
 * Reveal wraps content in a scroll-triggered fade-up.
 * Use <Reveal.Group> + <Reveal.Item> for staggered children.
 */
export function Reveal({
  children,
  className,
  variants = fadeUp,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={inViewProps.viewport}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function Group({
  children,
  className,
  stagger = 0.09,
  delayChildren = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={inViewProps.viewport}
    >
      {children}
    </motion.div>
  );
}

function Item({
  children,
  className,
  variants = fadeUp,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}) {
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

Reveal.Group = Group;
Reveal.Item = Item;
