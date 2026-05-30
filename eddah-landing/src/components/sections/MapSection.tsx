"use client";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { RiyadhMap } from "@/components/map/RiyadhMap";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { WhatsappIcon, PinIcon } from "@/components/icons/Icons";
import { whatsappLink } from "@/lib/brand";

const legend = [
  { color: "#C8773D", label: "نطاق الخدمة الحالي — حي لبن" },
  { color: "#E2A86C", label: "موقع عدة داخل الحي" },
  { color: "#9A958B", label: "أحياء مجاورة (قريبًا)" },
];

export function MapSection() {
  return (
    <section id="map" className="relative scroll-mt-24 py-24 md:py-32">
      <Container>
        <div className="surface overflow-hidden rounded-[2rem] p-2 shadow-card md:p-3">
          <div className="grid gap-2 lg:grid-cols-[1.35fr_1fr]">
            {/* Map panel */}
            <Reveal className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#0d0e13]">
              <div className="aspect-[4/3] w-full lg:aspect-auto lg:h-full">
                <RiyadhMap />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-white/5" />
            </Reveal>

            {/* Info panel */}
            <Reveal className="flex flex-col justify-center p-7 md:p-10">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-copper" />
                نطاق الخدمة
              </span>
              <h2 className="mt-5 text-balance text-3xl font-bold leading-[1.15] tracking-tightest text-sand md:text-[38px]">
                خدمتنا اليوم مركّزة على
                <span className="text-copper-gradient"> حي لبن</span>
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-sand-300">
                نخدم حي لبن في غرب الرياض حصرًا في هذه المرحلة. هذا التركيز يضمن
                وصولًا أسرع، ومعرفة أدق بالمنطقة، وجودة لا تتشتّت على مساحات واسعة.
              </p>

              <ul className="mt-7 space-y-3.5">
                {legend.map((l) => (
                  <li key={l.label} className="flex items-center gap-3 text-[14.5px] text-sand-300">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: l.color, boxShadow: `0 0 12px ${l.color}66` }}
                    />
                    {l.label}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <PinIcon className="h-6 w-6 shrink-0 text-copper-light" />
                <p className="text-[14px] leading-relaxed text-sand-300">
                  خارج حي لبن؟ راسلنا — نسجّل طلبك ضمن قائمة التوسّع القادمة.
                </p>
              </div>

              <div className="mt-7">
                <MagneticButton
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  icon={<WhatsappIcon className="h-5 w-5" />}
                >
                  اطلب داخل حي لبن
                </MagneticButton>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
