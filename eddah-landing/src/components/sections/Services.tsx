"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlumbingIcon, ElectricalIcon, CoolingIcon } from "@/components/icons/ServiceIcons";
import { ArrowIcon, CheckIcon } from "@/components/icons/Icons";
import { BrandImage } from "@/components/ui/BrandImage";
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
    <section id="services" className="relative scroll-mt-24 bg-clay-100/60 py-20 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="خدماتنا"
          title="ثلاثة تخصصات، نتقنها جيدًا"
          description="ركّزنا على ما يهم البيت أكثر. لا قوائم طويلة بلا عمق — بل ثلاث خدمات أساسية ننفّذها باحتراف داخل حي لبن."
        />

        <Reveal.Group className="mt-12 grid gap-5 lg:grid-cols-3" stagger={0.1}>
          {services.map((s) => (
            <Reveal.Item key={s.title}>
              <motion.article
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group card relative flex h-full flex-col overflow-hidden p-7 hover:shadow-card"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-orange-300 via-orange-500 to-orange-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="flex items-start justify-between">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-orange-500 ring-1 ring-orange-100 transition-transform duration-500 group-hover:scale-105">
                    <s.Icon className="h-9 w-9" />
                  </span>
                  <span className="text-2xl font-bold text-clay-300">{s.index}</span>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{s.tagline}</p>

                <ul className="mt-6 space-y-3 border-t border-clay-200 pt-6">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-center gap-3 text-[14.5px] text-ink-600">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>

                <a
                  href={whatsappLink(s.msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 text-[15px] font-semibold text-orange-600 transition-colors hover:text-orange-700"
                >
                  اطلب {s.title}
                  <ArrowIcon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-x-1" />
                </a>
              </motion.article>
            </Reveal.Item>
          ))}
        </Reveal.Group>

        {/* Products / tools band */}
        <Reveal className="mt-5">
          <div className="card grid items-center gap-8 overflow-hidden p-7 md:grid-cols-2 md:p-9">
            <div>
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                أدوات ومنتجات
              </span>
              <h3 className="mt-4 text-balance text-2xl font-bold leading-snug text-ink md:text-[30px]">
                نأتي مجهّزين بالأداة المناسبة لكل مهمة
              </h3>
              <p className="pretty mt-4 text-[15.5px] leading-relaxed text-ink-600">
                قطع ومنتجات موثوقة وأدوات احترافية — حتى تُنجَز الخدمة من أول
                زيارة، بجودة تدوم ولا تعيد المشكلة بعد أيام.
              </p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {["قطع غيار أصلية", "أدوات احترافية", "تشخيص دقيق", "ضمان على التنفيذ"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-[14.5px] text-ink-700">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <BrandImage image="products" className="aspect-square w-full rounded-[1.5rem] ring-1 ring-clay-200" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
