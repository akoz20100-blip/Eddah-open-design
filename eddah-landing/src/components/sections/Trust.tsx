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
    <section className="relative py-20 md:py-28">
      <div className="border-y border-clay-200/80 bg-clay-100/45 py-9">
        <Marquee items={keywords} />
      </div>

      <Container className="mt-20">
        <SectionHeading
          align="center"
          eyebrow="ثقة تُبنى بالتفاصيل"
          title="وعود نلتزم بها، لا شعارات"
          description="الثقة لا تُقال، تُمارَس. هذه المبادئ هي ما يجعل تجربتك مع عدة مختلفة."
        />

        {/* borderless editorial 4-up — accent rule instead of a boxed card */}
        <Reveal.Group className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4" stagger={0.09}>
          {guarantees.map((g) => (
            <Reveal.Item key={g.title}>
              <article className="group h-full">
                <span className="block h-[3px] w-9 rounded-full bg-orange-400/80 transition-all duration-500 group-hover:w-16" />
                <span className="mt-6 inline-flex text-orange-500 transition-transform duration-500 group-hover:-translate-y-0.5">
                  <g.icon className="h-7 w-7" />
                </span>
                <h3 className="mt-4 text-[18px] font-bold text-ink">{g.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">{g.body}</p>
              </article>
            </Reveal.Item>
          ))}
        </Reveal.Group>
      </Container>
    </section>
  );
}
