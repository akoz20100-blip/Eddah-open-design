"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import {
  PlumbingIcon,
  ElectricalIcon,
  CoolingIcon,
} from "@/components/icons/ServiceIcons";
import { ArrowIcon } from "@/components/icons/Icons";
import { whatsappLink } from "@/lib/brand";

const services = [
  {
    index: "٠١",
    Icon: PlumbingIcon,
    title: "السباكة",
    tagline: "ماء يجري كما يجب، بلا تسريب ولا انسداد.",
    items: ["كشف وإصلاح التسريبات", "تسليك المجاري والانسدادات", "تركيب وصيانة الخلاطات والسخانات", "معالجة ضعف الضغط"],
    msg: "السلام عليكم، أحتاج خدمة سباكة في حي لبن.",
  },
  {
    index: "٠٢",
    Icon: ElectricalIcon,
    title: "الكهرباء",
    tagline: "كهرباء آمنة ومستقرة في كل زاوية من بيتك.",
    items: ["إصلاح الأعطال والقواطع", "تمديد وصيانة الإنارة", "تركيب الأفياش والمفاتيح", "معالجة مشاكل اللوحة الكهربائية"],
    msg: "السلام عليكم، أحتاج خدمة كهرباء في حي لبن.",
  },
  {
    index: "٠٣",
    Icon: CoolingIcon,
    title: "التكييف والتبريد",
    tagline: "أجواء باردة ومريحة طوال صيف الرياض.",
    items: ["صيانة وتنظيف المكيفات", "إصلاح ضعف التبريد", "تعبئة الفريون", "تركيب وفك الوحدات"],
    msg: "السلام عليكم، أحتاج خدمة تكييف وتبريد في حي لبن.",
  },
];

export function Services() {
  return (
    <section id="services" className="relative scroll-mt-24 py-24 md:py-32">
      {/* soft top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-copper/30 to-transparent" />
      <Container>
        <SectionHeading
          eyebrow="خدماتنا"
          title="ثلاثة تخصصات، نتقنها جيدًا"
          description="ركّزنا على ما يهم البيت أكثر. لا قوائم طويلة بلا عمق — بل ثلاث خدمات أساسية ننفّذها باحتراف داخل حي لبن."
        />

        <Reveal.Group className="mt-14 grid gap-5 lg:grid-cols-3" stagger={0.1}>
          {services.map((s) => (
            <Reveal.Item key={s.title}>
              <motion.article
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group surface relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-7"
              >
                {/* hover sheen */}
                <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-l from-copper/0 via-copper/[0.06] to-copper/0 transition-transform duration-700 group-hover:translate-x-full" />

                <div className="flex items-start justify-between">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl border border-copper/25 bg-copper/[0.08] text-copper-light transition-transform duration-500 group-hover:scale-105">
                    <s.Icon className="h-9 w-9" />
                  </span>
                  <span className="text-2xl font-bold text-white/10">{s.index}</span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-sand">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-sand-300">
                  {s.tagline}
                </p>

                <ul className="mt-6 space-y-3 border-t border-white/8 pt-6">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-center gap-3 text-[14.5px] text-sand-300">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                      {it}
                    </li>
                  ))}
                </ul>

                <a
                  href={whatsappLink(s.msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 text-[15px] font-semibold text-copper-light transition-colors hover:text-copper"
                >
                  اطلب {s.title}
                  <ArrowIcon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-x-1" />
                </a>
              </motion.article>
            </Reveal.Item>
          ))}
        </Reveal.Group>
      </Container>
    </section>
  );
}
