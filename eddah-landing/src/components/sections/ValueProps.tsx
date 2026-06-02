"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { fadeUp, inViewProps, staggerContainer } from "@/lib/motion";
import {
  BoltSpeedIcon,
  CalendarIcon,
  PinIcon,
  ShieldIcon,
  ClockIcon,
  SparkleIcon,
} from "@/components/icons/Icons";

const values = [
  { n: "٠١", icon: BoltSpeedIcon, title: "استجابة سريعة", body: "طلبك يصل مباشرة، ونتحرّك بأقرب فنّي داخل الحي بدون انتظار طويل." },
  { n: "٠٢", icon: CalendarIcon, title: "مواعيد منظّمة", body: "نحدّد موعدًا واضحًا ونلتزم به، فتعرف متى يصل الفنّي بالضبط." },
  { n: "٠٣", icon: PinIcon, title: "فنّي قريب منك", body: "تركيزنا على حي لبن وحده يعني قُربًا حقيقيًا ومعرفة بتفاصيل المنطقة." },
  { n: "٠٤", icon: ShieldIcon, title: "ضمان على الشغل", body: "فنّيون مهرة وأدوات مناسبة، والعمل يُسلَّم نظيفًا ونقف خلف جودته." },
  { n: "٠٥", icon: ClockIcon, title: "وضوح من البداية", body: "نشرح المشكلة والحل والتكلفة قبل البدء — بلا مفاجآت ولا غموض." },
  { n: "٠٦", icon: SparkleIcon, title: "تجربة مرتّبة من أول تواصل", body: "خطوات قليلة من الطلب إلى الإنجاز، صُمّمت لتكون سريعة ومريحة." },
];

export function ValueProps() {
  return (
    <section id="why" className="relative scroll-mt-24 py-20 md:py-28">
      <Container>
        <div className="grid gap-y-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-x-16">
          {/* heading — sticky editorial column */}
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={inViewProps.viewport}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <motion.span variants={fadeUp} className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              لماذا عدة
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="mt-5 text-balance text-3xl font-bold leading-[1.14] text-ink md:text-[44px]"
            >
              صيانة تُدار بانضباط،
              <br className="hidden sm:block" /> لا بالصدفة
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="pretty mt-5 max-w-md text-[17px] leading-relaxed text-ink-500"
            >
              بنينا عدة لتكون أبسط وأوضح طريقة لإصلاح بيتك في حي لبن — تجربة
              محلية مرتّبة من أول رسالة حتى آخر لمسة.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex items-center gap-3 text-ink-400">
              <span className="h-px w-12 bg-orange-300" />
              <span className="text-[13.5px] font-medium">ست ركائز نلتزم بها</span>
            </motion.div>
          </motion.div>

          {/* values — borderless editorial spec list, two columns */}
          <Reveal.Group
            className="grid gap-x-10 sm:grid-cols-2"
            stagger={0.07}
          >
            {values.map((v) => (
              <Reveal.Item key={v.title}>
                <article className="group flex h-full gap-4 border-t border-clay-200/80 py-7">
                  <span className="font-display pt-1.5 text-[15px] font-semibold leading-none text-orange-400/90">
                    {v.n}
                  </span>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <v.icon className="h-[18px] w-[18px] text-orange-500 transition-transform duration-500 group-hover:-translate-y-0.5" />
                      <h3 className="text-[18px] font-bold text-ink">{v.title}</h3>
                    </div>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">{v.body}</p>
                  </div>
                </article>
              </Reveal.Item>
            ))}
          </Reveal.Group>
        </div>
      </Container>
    </section>
  );
}
