import type { Variants, Transition } from "framer-motion";

/**
 * One easing language for the whole site.
 * expoOut is the signature curve: decisive, premium, never bouncy.
 */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const baseTransition: Transition = {
  duration: 0.7,
  ease: EASE_OUT,
};

/** Container that staggers its children on scroll-into-view. */
export const staggerContainer = (stagger = 0.09, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/** Default rise-and-fade for revealed items. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: baseTransition,
  },
};

export const fadeUpSmall: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};

/** Used for headline word-by-word reveals. */
export const wordReveal: Variants = {
  hidden: { opacity: 0, y: "0.5em" },
  show: {
    opacity: 1,
    y: "0em",
    transition: { duration: 0.85, ease: EASE_OUT },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: baseTransition },
};

/** Shared whileInView config so every section reveals consistently. */
export const inViewProps = {
  initial: "hidden" as const,
  whileInView: "show" as const,
  viewport: { once: true, margin: "-12% 0px -12% 0px" },
};
