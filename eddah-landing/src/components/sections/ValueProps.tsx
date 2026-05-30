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
  { icon: BoltSpeedIcon, title: "استجابة سريعة", body: "طلبك يصل مباشرة، ونتحرّك بأقرب فنّي داخل الحي بدون انتظار طويل." },
  { icon: CalendarIcon, title: "مواعيد منظّمة", body: "نحدّد موعدًا واضحًا ونلتزم به، فتعرف متى يصل الفنّي بالضبط." },
  { icon: PinIcon, title: "خدمة محلية", body: "تركيزنا على حي لبن وحده يعني قُربًا حقيقيًا ومعرفة بتفاصيل المنطقة." },
  { icon: ShieldIcon, title: "تنفيذ موثوق", body: "فنّيون مهرة وأدوات مناسبة، والعمل يُسلَّم نظيفًا ومضمون الجودة." },
  { icon: ClockIcon, title: "وضوح من البداية", body: "نشرح المشكلة والحل والتكلفة قبل البدء — بلا مفاجآت ولا غموض." },
  { icon: SparkleIcon, title: "تجربة أسهل", body: "خطوات قليلة من الطلب إلى الإنجاز، صُمّمت لتكون سريعة ومريحة." },
];

export function ValueProps() {
  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="لماذا عدة"
          title="صيانة تُدار بانضباط، لا بالصدفة"
          description="بنينا عدة لتكون أبسط وأوضح طريقة لإصلاح بيتك في حي لبن — تجربة محلية مرتّبة من أول رسالة حتى آخر لمسة."
        />

        <Reveal.Group className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {values.map((v) => (
            <Reveal.Item key={v.title}>
              <article className="group card relative h-full overflow-hidden p-7 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-100/0 blur-2xl transition-all duration-500 group-hover:bg-orange-100" />
                <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-500 ring-1 ring-orange-100 transition-colors duration-500 group-hover:bg-orange-500 group-hover:text-white">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-5 text-[19px] font-bold text-ink">{v.title}</h3>
                <p className="relative mt-2.5 text-[15px] leading-relaxed text-ink-500">{v.body}</p>
              </article>
            </Reveal.Item>
          ))}
        </Reveal.Group>
      </Container>
    </section>
  );
}
