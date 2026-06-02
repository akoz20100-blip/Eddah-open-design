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
      <div className="border-y border-clay-200 bg-clay-100/55 py-10 shadow-airy">
        <Marquee items={keywords} />
      </div>

      <Container className="mt-20">
        <SectionHeading
          align="center"
          eyebrow="ثقة تُبنى بالتفاصيل"
          title="وعود نلتزم بها، لا شعارات"
          description="الثقة لا تُقال، تُمارَس. هذه المبادئ هي ما يجعل تجربتك مع عدة مختلفة."
        />

        <Reveal.Group className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.09}>
          {guarantees.map((g) => (
            <Reveal.Item key={g.title}>
              <div className="group relative h-full overflow-hidden rounded-3xl bg-white p-6 shadow-airy ring-1 ring-clay-200/70 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-airy-lg hover:ring-orange-200">
                <span className="absolute inset-x-6 top-0 h-1 origin-right scale-x-0 rounded-b-full bg-orange-500 transition-transform duration-500 group-hover:scale-x-100" />
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-500 ring-1 ring-orange-100 transition-colors duration-500 group-hover:bg-orange-500 group-hover:text-white">
                  <g.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-[17px] font-bold text-ink">{g.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{g.body}</p>
              </div>
            </Reveal.Item>
          ))}
        </Reveal.Group>
      </Container>
    </section>
  );
}
