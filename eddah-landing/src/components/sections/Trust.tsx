"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Marquee } from "@/components/ui/Marquee";
import { CalendarIcon, CheckIcon, ShieldIcon, RouteIcon } from "@/components/icons/Icons";

const keywords = [
  "سرعة في الاستجابة",
  "تنظيم المواعيد",
  "تركيز على حي لبن",
  "أسعار واضحة",
  "تنفيذ محترف",
  "خدمة موثوقة",
];

const guarantees = [
  { icon: CalendarIcon, title: "مواعيد نلتزم بها", body: "موعد محدّد مسبقًا نصل فيه، لا نوافذ انتظار مفتوحة." },
  { icon: CheckIcon, title: "وضوح قبل البدء", body: "نشرح العطل والحل والتكلفة، فلا تدفع مقابل غموض." },
  { icon: ShieldIcon, title: "تنفيذ مضمون", body: "عمل نظيف بأيدٍ ماهرة، نقف خلف جودته بعد الإنجاز." },
  { icon: RouteIcon, title: "قُرب حقيقي", body: "وجودنا داخل الحي يجعل المتابعة والرجوع إليك أسهل." },
];

export function Trust() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="hairline" />
      <div className="py-12">
        <Marquee items={keywords} />
      </div>
      <div className="hairline" />

      <Container className="mt-20">
        <SectionHeading
          align="center"
          eyebrow="ثقة تُبنى بالتفاصيل"
          title="وعود نلتزم بها، لا شعارات"
          description="الثقة لا تُقال، تُمارَس. هذه المبادئ هي ما يجعل تجربتك مع عدة مختلفة."
        />

        <Reveal.Group className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.09}>
          {guarantees.map((g) => (
            <Reveal.Item key={g.title}>
              <div className="group surface h-full rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-copper/40">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-copper/10 text-copper-light transition-colors duration-500 group-hover:bg-copper group-hover:text-ink">
                  <g.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-[17px] font-bold text-sand">{g.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-sand-500">{g.body}</p>
              </div>
            </Reveal.Item>
          ))}
        </Reveal.Group>
      </Container>
    </section>
  );
}
