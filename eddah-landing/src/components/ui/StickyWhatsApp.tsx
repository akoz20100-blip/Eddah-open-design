"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { WhatsappIcon } from "@/components/icons/Icons";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { whatsappLink } from "@/lib/brand";
import { EASE_OUT } from "@/lib/motion";

export function StickyWhatsApp() {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useEffect(() => {
    setIsVisible(window.scrollY > 600);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsVisible(latest > 600);
  });

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.16 }
              : { duration: 0.45, ease: EASE_OUT }
          }
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-50 sm:left-6"
        >
          <MagneticButton
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            icon={<WhatsappIcon className="h-5 w-5" />}
            className="shadow-airy-lg"
          >
            <span className="sm:hidden">واتساب</span>
            <span className="hidden sm:inline">تواصل واتساب</span>
          </MagneticButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
