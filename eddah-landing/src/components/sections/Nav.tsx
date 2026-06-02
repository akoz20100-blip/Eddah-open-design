"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { WhatsappIcon } from "@/components/icons/Icons";
import { whatsappLink } from "@/lib/brand";
import { EASE_OUT } from "@/lib/motion";

const links = [
  { href: "#services", label: "الخدمات" },
  { href: "#how", label: "كيف نشتغل" },
  { href: "#why", label: "ليش عدة" },
  { href: "#laban", label: "حي لبن" },
  { href: "#contact", label: "تواصل" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`transition-all duration-500 ${
          scrolled
            ? "border-b border-clay-200/80 bg-clay-50/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <Container className="flex h-[68px] items-center justify-between">
          <a href="#top" aria-label="عدة" className="shrink-0">
            <Logo />
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-[15px] text-ink-600 transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <ThemeToggle />
            <MagneticButton
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              icon={<WhatsappIcon className="h-[18px] w-[18px]" />}
              className="px-5 py-2.5 text-sm"
            >
              اطلب الآن
            </MagneticButton>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-clay-200 bg-white text-ink"
              aria-label="القائمة"
            >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-5 bg-current transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-current transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </div>
            </button>
          </div>
        </Container>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="overflow-hidden border-b border-clay-200 bg-clay-50/95 backdrop-blur-xl md:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-[17px] text-ink-600 transition-colors hover:bg-clay-100 hover:text-ink"
                >
                  {l.label}
                </a>
              ))}
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-orange-500 py-3.5 font-semibold text-white"
              >
                <WhatsappIcon className="h-5 w-5" />
                اطلب الآن عبر واتساب
              </a>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
