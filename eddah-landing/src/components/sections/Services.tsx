"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlumbingIcon, ElectricalIcon, CoolingIcon } from "@/components/icons/ServiceIcons";
import { ArrowIcon, CheckIcon } from "@/components/icons/Icons";
import { BrandImage } from "@/components/ui/BrandImage";
import type { BrandImageKey } from "@/lib/brandImages";
import { whatsappLink } from "@/lib/brand";
import { cn } from "@/lib/cn";

type Service = {
  index: string;
  Icon: typeof PlumbingIcon;
  image: BrandImageKey;
  title: string;
  tagline: string;
  items: string[];
  msg: string;
};

const services: Service[] = [
  {
    index: "٠١",
    Icon: PlumbingIcon,
    image: "servicePlumbing",
    title: "السباكة",
    tagline: "ماء يجري كما يجب، بلا تسريب ولا انسداد.",
    items: ["كشف وإصلاح التسريبات", "تسليك المجاري والانسدادات", "تركيب وصيانة الخلاطات والسخانات", "معالجة ضعف الضغط"],
    msg: "السلام عليكم، أحتاج خدمة سباكة في حي لبن.",
  },
  {
    index: "٠٢",
    Icon: ElectricalIcon,
    image: "serviceElectrical",
    title: "الكهرباء",
    tagline: "كهرباء آمنة ومستقرة في كل زاوية من بيتك.",
    items: ["إصلاح الأعطال والقواطع", "تمديد وصيانة الإنارة", "تركيب الأفياش والمفاتيح", "معالجة مشاكل اللوحة الكهربائية"],
    msg: "السلام عليكم، أحتاج خدمة كهرباء في حي لبن.",
  },
  {
    index: "٠٣",
    Icon: CoolingIcon,
    image: "serviceAc",
    title: "التكييف",
    tagline: "أجواء باردة ومريحة طوال صيف الرياض.",
    items: ["صيانة وتنظيف المكيفات", "إصلاح ضعف التبريد", "تعبئة الفريون", "تركيب وفك الوحدات"],
    msg: "السلام عليكم، أحتاج خدمة تكييف في حي لبن.",
  },
];

export function Services() {
  return (
    <section id="services" className="relative scroll-mt-24 overflow-hidden bg-clay-100/60 py-20 md:py-28">
      {/* map-line accent — concentric contours echoing the حي لبن map */}
      <MapLines />

      <Container className="relative">
        <SectionHeading
          eyebrow="خدماتنا"
          title="ثلاثة تخصصات، نتقنها جيدًا"
          description="ركّزنا على ما يهم البيت أكثر. لا قوائم طويلة بلا عمق — بل ثلاث خدمات أساسية ننفّذها باحتراف داخل حي لبن."
        />

        {/* asymmetric editorial bento: السباكة featured, الكهرباء + التكييف stacked */}
        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:auto-rows-fr">
          <Reveal className="h-full lg:col-span-2 lg:row-span-2">
            <ServiceCard s={services[0]} featured />
          </Reveal>
          <Reveal className="h-full" delay={0.08}>
            <ServiceCard s={services[1]} />
          </Reveal>
          <Reveal className="h-full" delay={0.16}>
            <ServiceCard s={services[2]} />
          </Reveal>
        </div>

        {/* tools / readiness band — image bleeds under an overlapping stone panel */}
        <Reveal className="mt-5">
          <div className="relative overflow-hidden rounded-[2.25rem] ring-1 ring-clay-200/70 shadow-soft">
            <BrandImage
              image="toolsShowcase"
              rounded={false}
              className="absolute inset-0 -z-10 h-full w-full"
              imgClassName="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-l from-white/95 via-white/80 to-white/35" />
            <div className="max-w-xl p-8 md:p-12">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                أدوات ومنتجات
              </span>
              <h3 className="mt-4 text-balance text-2xl font-bold leading-snug text-ink md:text-[32px]">
                نأتي مجهّزين بالأداة المناسبة لكل مهمة
              </h3>
              <p className="pretty mt-4 text-[15.5px] leading-relaxed text-ink-600">
                قطع ومنتجات موثوقة وأدوات احترافية — حتى تُنجَز الخدمة من أول
                زيارة، بجودة تدوم ولا تعيد المشكلة بعد أيام.
              </p>
              <ul className="mt-6 grid max-w-md gap-2.5 sm:grid-cols-2">
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
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function ServiceCard({ s, featured = false }: { s: Service; featured?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], featured ? ["-7%", "7%"] : ["-5%", "5%"]);

  return (
    <motion.article
      ref={ref}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className={cn(
        "group relative isolate flex h-full flex-col overflow-hidden rounded-[2.25rem] ring-1 ring-clay-200/70 shadow-airy transition-[box-shadow,ring-color] duration-500 hover:ring-orange-300/70 hover:shadow-airy-lg",
        featured ? "min-h-[28rem]" : "min-h-[20rem]",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-5 top-0 z-20 h-1 origin-right scale-x-0 rounded-b-full bg-orange-500 transition-transform duration-500 ease-out group-hover:scale-x-100"
      />

      {/* parallax image layer */}
      <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-[7%] -z-10">
        <BrandImage
          image={s.image}
          rounded={false}
          priority={featured}
          className="h-full w-full"
          imgClassName="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
      </motion.div>

      {/* gentle top scrim so the index reads on bright images */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-ink-900/18 via-transparent to-transparent" />

      <span className="absolute right-5 top-5 z-20 rounded-full border border-white/55 bg-white/20 px-3 py-1.5 text-[13px] font-bold tracking-[0.25em] text-white shadow-airy backdrop-blur-xl ring-1 ring-ink/5 transition-colors duration-500 group-hover:bg-white/30">
        {s.index}
      </span>

      <div className="flex-1" />

      {/* frosted glass content panel overlapping the image */}
      <div className="relative m-3 rounded-[1.6rem] border border-white/80 bg-white/[0.86] p-6 shadow-airy backdrop-blur-2xl ring-1 ring-white/60 transition-colors duration-500 group-hover:bg-white/[0.9] md:m-4 md:p-7">
        {/* icon badge straddling the panel edge */}
        <span className="absolute -top-7 right-6 grid h-14 w-14 place-items-center rounded-2xl bg-orange-500 text-white shadow-orange-glow ring-4 ring-white transition-transform duration-500 group-hover:-translate-y-1">
          <s.Icon className="h-7 w-7" />
        </span>

        <h3 className="text-2xl font-bold text-ink">{s.title}</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">{s.tagline}</p>

        <ul
          className={cn(
            "mt-5 gap-x-6 gap-y-2.5 border-t border-clay-200/80 pt-5",
            featured ? "grid sm:grid-cols-2" : "grid",
          )}
        >
          {s.items.map((it) => (
            <li key={it} className="flex items-center gap-2.5 text-[14px] text-ink-700">
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
          className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-orange-600 transition-colors hover:text-orange-700"
        >
          اطلب {s.title}
          <ArrowIcon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-x-1" />
        </a>
      </div>
    </motion.article>
  );
}

function MapLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <svg
        className="absolute -left-24 top-8 h-[44rem] w-[44rem] opacity-[0.06]"
        viewBox="0 0 400 400"
        fill="none"
        stroke="#DC6E0B"
        strokeWidth="1.2"
      >
        {[150, 110, 72, 40].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} />
        ))}
        <path d="M0 150 H400 M0 250 H400 M150 0 V400 M250 0 V400" strokeWidth="0.8" />
        <circle cx="200" cy="200" r="6" fill="#F2820C" stroke="none" />
      </svg>
    </div>
  );
}
