"use client";

import { Container } from "@/components/ui/Container";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Reveal } from "@/components/ui/Reveal";
import { BrandImage } from "@/components/ui/BrandImage";
import { WhatsappIcon, PhoneIcon, PinIcon } from "@/components/icons/Icons";
import { whatsappLink, telLink } from "@/lib/brand";

export function CTASection() {
  return (
    <section id="contact" className="relative scroll-mt-24 py-20 md:py-28">
      <Container>
        <Reveal className="relative overflow-hidden rounded-[2.25rem] border border-orange-200 bg-gradient-to-br from-orange-50 via-clay-50 to-orange-50 px-7 py-16 text-center shadow-card md:px-12 md:py-24">
          {/* faded brand creative as backdrop */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.10]">
            <BrandImage image="toolsFloat" rounded={false} lighten className="h-full w-full" imgClassName="object-cover" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-clay-50/90 via-clay-50/40 to-clay-50/80" />

          <div className="relative">
            <span className="chip mx-auto">
              <PinIcon className="h-4 w-4 text-orange-500" />
              متاحون الآن في حي لبن
            </span>

            <h2 className="mx-auto mt-7 max-w-3xl text-balance text-[clamp(2rem,5vw,3.4rem)] font-bold leading-[1.08] tracking-tightest text-ink">
              بيتك يحتاج إصلاحًا؟
              <br />
              <span className="text-orange-gradient">فنّيك في حيّك.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-600">
              راسلنا عبر واتساب بوصف بسيط لمشكلتك، ونتكفّل بالباقي — موعد واضح،
              وصول سريع، وتنفيذ تثق فيه.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton href={whatsappLink()} target="_blank" rel="noopener noreferrer" variant="whatsapp" icon={<WhatsappIcon className="h-5 w-5" />}>
                اطلب عبر واتساب
              </MagneticButton>
              <MagneticButton href={telLink()} variant="ghost" icon={<PhoneIcon className="h-5 w-5" />}>
                اتصل بنا
              </MagneticButton>
            </div>

            <p className="mt-8 text-[13px] text-ink-500">خدمة سباكة وكهرباء وتكييف وتبريد — حي لبن، الرياض.</p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
