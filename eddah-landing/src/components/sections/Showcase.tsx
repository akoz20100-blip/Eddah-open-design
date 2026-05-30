"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { BrandImage } from "@/components/ui/BrandImage";
import { fadeUp, inViewProps, staggerContainer } from "@/lib/motion";
import type { BrandImageKey } from "@/lib/brandImages";
import { CheckIcon } from "@/components/icons/Icons";

type Feature = {
  image: BrandImageKey;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  points: string[];
  flip?: boolean;
  aspect: string;
};

const features: Feature[] = [
  {
    image: "precision",
    eyebrow: "إتقان التنفيذ",
    title: (
      <>
        دقّة <span className="text-orange-gradient">لا تغلط</span>
      </>
    ),
    body: "كل وصلة، وكل زاوية، وكل تفصيلة محسوبة. غلطة صغيرة قد تكلّفك كثيرًا، لذلك نبني كل عمل على دقّة لا تتحمّل الخطأ — لأن الاحتراف لا يعرف العشوائية.",
    points: ["فحص قبل وبعد كل خدمة", "أدوات احترافية مناسبة لكل مهمة", "تسليم نظيف ومرتّب"],
    aspect: "aspect-[4/3]",
  },
  {
    image: "trustWater",
    eyebrow: "موثوقية تستحقها",
    title: (
      <>
        ثقة <span className="text-orange-gradient">لا تتسرّب</span>
      </>
    ),
    body: "مثل ما نمنع التسريب، نبني الثقة. تعتمد علينا فتعرف أن الموضوع انتهى وراحة البال في يدك — خدمة تتم بهدوء واحتراف، وتبقى نتيجتها معك.",
    points: ["وضوح في السعر قبل البدء", "التزام بالموعد المتفق عليه", "متابعة بعد إتمام العمل"],
    flip: true,
    aspect: "aspect-[4/5]",
  },
];

export function Showcase() {
  return (
    <section className="relative py-20 md:py-28">
      <Container className="space-y-20 md:space-y-28">
        {features.map((f) => (
          <FeatureRow key={f.image} {...f} />
        ))}
      </Container>
    </section>
  );
}

function FeatureRow({ image, eyebrow, title, body, points, flip, aspect }: Feature) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      {/* image */}
      <Reveal className={flip ? "lg:order-2" : ""}>
        <div className="relative">
          <div className="absolute -inset-3 rounded-[2.5rem] bg-orange-100/50 blur-2xl" />
          <BrandImage image={image} className={`${aspect} w-full rounded-[2rem] shadow-lift ring-1 ring-black/5`} />
        </div>
      </Reveal>

      {/* copy */}
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={inViewProps.viewport}
        className={flip ? "lg:order-1" : ""}
      >
        <motion.span variants={fadeUp} className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          {eyebrow}
        </motion.span>
        <motion.h2 variants={fadeUp} className="mt-4 text-balance text-3xl font-bold leading-[1.12] tracking-tightest text-ink md:text-[42px]">
          {title}
        </motion.h2>
        <motion.p variants={fadeUp} className="pretty mt-5 max-w-xl text-[17px] leading-relaxed text-ink-600">
          {body}
        </motion.p>
        <motion.ul variants={fadeUp} className="mt-7 space-y-3.5">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 text-[15.5px] text-ink-700">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-500 text-white">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              {p}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </div>
  );
}
