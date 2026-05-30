"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { StarIcon } from "@/components/icons/Icons";

/**
 * Sample testimonials — replace with real customer quotes before launch.
 * Faces are intentionally avoided (initials avatars) so no stock-photo person
 * misrepresents a real customer.
 */
const items = [
  {
    quote: "وصلوا في نفس اليوم وحلّوا تسريبًا كان يأرقني من أسبوع. شغل نظيف وواضح من أول رسالة.",
    name: "أبو ناصر",
    area: "حي لبن",
    initial: "ن",
    color: "#F0851A",
  },
  {
    quote: "أول مرة أرى صيانة بموعد محدّد يلتزمون به فعلًا. تعامل راقٍ وسعر واضح قبل ما يبدؤون.",
    name: "منيرة",
    area: "حي لبن",
    initial: "م",
    color: "#3A332C",
  },
  {
    quote: "المكيّف رجع يبرّد عدل، والفنّي شرح لي المشكلة بهدوء. خدمة قريبة أرتاح لها وأثق فيها.",
    name: "عبدالعزيز",
    area: "حي لبن",
    initial: "ع",
    color: "#DC6E0B",
  },
];

export function Testimonials() {
  return (
    <section className="relative bg-clay-100/60 py-20 md:py-28">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="آراء الأهالي"
          title="ناس من حي لبن جرّبونا"
          description="كلمات قصيرة من جيران خدمناهم. مصداقيتنا تُبنى بيتًا بيتًا، وموعدًا بعد موعد."
        />

        <Reveal.Group className="mt-12 grid gap-4 md:grid-cols-3" stagger={0.1}>
          {items.map((t) => (
            <Reveal.Item key={t.name}>
              <figure className="card flex h-full flex-col p-7">
                <div className="flex items-center gap-1 text-orange-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="pretty mt-4 flex-1 text-[15.5px] leading-relaxed text-ink-700">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-clay-200 pt-5">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-full text-[16px] font-bold text-white"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initial}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-ink">{t.name}</p>
                    <p className="text-[13px] text-ink-500">{t.area}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal.Item>
          ))}
        </Reveal.Group>
      </Container>
    </section>
  );
}
