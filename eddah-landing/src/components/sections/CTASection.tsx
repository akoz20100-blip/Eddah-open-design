"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsappIcon, PhoneIcon, PinIcon } from "@/components/icons/Icons";
import { whatsappLink, WHATSAPP_NUMBER } from "@/lib/brand";

export function CTASection() {
  return (
    <section id="contact" className="relative scroll-mt-24 py-24 md:py-32">
      <Container>
        <Reveal className="relative overflow-hidden rounded-[2.25rem] border border-copper/25 bg-ink-800 px-7 py-16 text-center md:px-12 md:py-24">
          {/* glow */}
          <div className="copper-radial pointer-events-none absolute inset-0" />
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-copper/20 blur-3xl"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/[0.08] px-4 py-2 text-[13px] font-medium text-copper-light">
              <PinIcon className="h-4 w-4" />
              متاحون الآن في حي لبن
            </span>

            <h2 className="mx-auto mt-7 max-w-3xl text-balance text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[1.1] tracking-tightest text-sand">
              بيتك يحتاج إصلاحًا؟
              <br />
              <span className="text-copper-gradient">فنّيك في حيّك.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-sand-300">
              راسلنا عبر واتساب بوصف بسيط لمشكلتك، ونتكفّل بالباقي — موعد واضح،
              وصول سريع، وتنفيذ تثق فيه.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                variant="whatsapp"
                icon={<WhatsappIcon className="h-5 w-5" />}
              >
                اطلب عبر واتساب
              </MagneticButton>
              <MagneticButton
                href={`tel:+${WHATSAPP_NUMBER}`}
                variant="ghost"
                icon={<PhoneIcon className="h-5 w-5" />}
              >
                اتصل بنا
              </MagneticButton>
            </div>

            <p className="mt-8 text-[13px] text-sand-500">
              خدمة سباكة وكهرباء وتكييف وتبريد — حي لبن، الرياض.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
