"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { SparkleIcon, WhatsappIcon } from "@/components/icons/Icons";
import { PlumbingIcon } from "@/components/icons/ServiceIcons";

const steps = [
  { n: "١", Icon: PlumbingIcon, title: "اختر الخدمة", body: "حدّد ما تحتاجه: سباكة، كهرباء، أو تكييف وتبريد." },
  { n: "٢", Icon: WhatsappIcon, title: "أرسل طلبك", body: "راسلنا عبر واتساب بوصف بسيط للمشكلة وموقعك في الحي." },
  { n: "٣", Icon: SparkleIcon, title: "ننسّق ونخدمك", body: "نؤكّد موعدًا واضحًا، يصل الفنّي، وينجز العمل بإتقان." },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-24 py-20 md:py-28">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="كيف نعمل"
          title="من الطلب إلى الإنجاز في ثلاث خطوات"
          description="بسّطنا الطريق قدر الإمكان، حتى يصبح إصلاح بيتك قرارًا سهلًا لا مهمة مرهقة."
        />

        <div className="relative mt-14">
          <div className="absolute inset-x-[14%] top-12 hidden h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent md:block" />

          <Reveal.Group className="grid gap-8 md:grid-cols-3" stagger={0.14}>
            {steps.map((s) => (
              <Reveal.Item key={s.n} className="relative text-center">
                <div className="relative mx-auto grid h-24 w-24 place-items-center">
                  <div className="absolute inset-0 rounded-full border border-clay-200 bg-white shadow-soft" />
                  <div className="absolute inset-2 rounded-full bg-orange-50" />
                  <s.Icon className="relative h-9 w-9 text-orange-500" />
                  <span className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-[15px] font-bold text-white shadow-orange-glow">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-ink">{s.title}</h3>
                <p className="mx-auto mt-2.5 max-w-[18rem] text-[15px] leading-relaxed text-ink-500">{s.body}</p>
              </Reveal.Item>
            ))}
          </Reveal.Group>
        </div>
      </Container>
    </section>
  );
}
