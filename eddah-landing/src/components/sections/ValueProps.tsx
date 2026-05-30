"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import {
  BoltSpeedIcon,
  CalendarIcon,
  PinIcon,
  ShieldIcon,
  ClockIcon,
  SparkleIcon,
} from "@/components/icons/Icons";

const values = [
  {
    icon: BoltSpeedIcon,
    title: "استجابة سريعة",
    body: "طلبك يصل مباشرة، ونتحرّك بأقرب فنّي داخل الحي بدون انتظار طويل.",
  },
  {
    icon: CalendarIcon,
    title: "مواعيد منظّمة",
    body: "نحدّد موعدًا واضحًا ونلتزم به، فتعرف متى يصل الفنّي بالضبط.",
  },
  {
    icon: PinIcon,
    title: "خدمة محلية",
    body: "تركيزنا على حي لبن وحده يعني قُربًا حقيقيًا ومعرفة بتفاصيل المنطقة.",
  },
  {
    icon: ShieldIcon,
    title: "تنفيذ موثوق",
    body: "فنّيون مهرة وأدوات مناسبة، والعمل يُسلَّم نظيفًا ومضمون الجودة.",
  },
  {
    icon: ClockIcon,
    title: "وضوح من البداية",
    body: "نشرح المشكلة والحل والتكلفة قبل البدء — بلا مفاجآت ولا غموض.",
  },
  {
    icon: SparkleIcon,
    title: "تجربة أسهل",
    body: "خطوات قليلة من الطلب إلى الإنجاز، صُمّمت لتكون سريعة ومريحة.",
  },
];

export function ValueProps() {
  return (
    <section className="relative py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="لماذا عدة"
          title="صيانة تُدار بانضباط، لا بالصدفة"
          description="بنينا عدة لتكون أبسط وأوضح طريقة لإصلاح بيتك في حي لبن — تجربة محلية مرتّبة من أول رسالة حتى آخر لمسة."
        />

        <Reveal.Group
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.08}
        >
          {values.map((v) => (
            <Reveal.Item key={v.title}>
              <article className="group surface relative h-full overflow-hidden rounded-3xl p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-copper/40">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-copper/0 blur-2xl transition-all duration-500 group-hover:bg-copper/15" />
                <span className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-copper-light transition-colors duration-500 group-hover:border-copper/40">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-5 text-[19px] font-bold text-sand">
                  {v.title}
                </h3>
                <p className="relative mt-2.5 text-[15px] leading-relaxed text-sand-500">
                  {v.body}
                </p>
              </article>
            </Reveal.Item>
          ))}
        </Reveal.Group>
      </Container>
    </section>
  );
}
