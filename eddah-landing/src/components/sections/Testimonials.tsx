"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { CheckIcon } from "@/components/icons/Icons";

const items = [
  {
    concern: "أبغى أحد قريب وما يتأخر",
    answer: "نطاقنا مركّز داخل حي لبن، وهذا يخلي التنسيق والوصول والمتابعة أسرع وأوضح.",
    label: "قرب",
    initial: "ق",
    color: "#F0851A",
  },
  {
    concern: "أخاف تبدأ الشغلة وتزيد التكلفة",
    answer: "نشرح العطل والحل قبل البدء، ونعطيك صورة واضحة عن المطلوب بدون مفاجآت.",
    label: "وضوح",
    initial: "و",
    color: "#3A332C",
  },
  {
    concern: "أحتاج شغل يخلص صح من أول مرة",
    answer: "نجهّز الفني بالأداة المناسبة ونراجع التنفيذ قبل التسليم، مع ضمان على الشغل.",
    label: "ضمان",
    initial: "ض",
    color: "#DC6E0B",
  },
];

export function Testimonials() {
  return (
    <section className="relative bg-clay-100/60 py-20 md:py-28">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="أسئلة قبل الطلب"
          title="نزيل القلق قبل ما نبدأ"
          description="أكثر ما يهم العميل قبل زيارة الفني: القرب، الوضوح، وضمان النتيجة."
        />

        <Reveal.Group className="mt-12 grid gap-4 md:grid-cols-3" stagger={0.1}>
          {items.map((t) => (
            <Reveal.Item key={t.label}>
              <article className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-airy ring-1 ring-clay-200/70">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-full text-[16px] font-bold text-white"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initial}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-orange-600">{t.label}</p>
                    <h3 className="mt-0.5 text-[17px] font-bold text-ink">{t.concern}</h3>
                  </div>
                </div>
                <p className="pretty mt-5 flex-1 text-[15.5px] leading-relaxed text-ink-600">
                  {t.answer}
                </p>
                <div className="mt-6 flex items-center gap-2 border-t border-clay-200 pt-5 text-[14px] font-semibold text-ink-700">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  واضح من أول تواصل
                </div>
              </article>
            </Reveal.Item>
          ))}
        </Reveal.Group>
      </Container>
    </section>
  );
}
