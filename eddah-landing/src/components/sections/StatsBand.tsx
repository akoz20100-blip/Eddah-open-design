"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

const toArabic = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref}>
      {toArabic(val)}
      {suffix}
    </span>
  );
}

const stats = [
  { to: 3, suffix: "", label: "تخصصات أساسية نتقنها" },
  { to: 100, suffix: "٪", label: "خدمة محلية في حي لبن" },
  { to: 3, suffix: "", label: "خطوات بسيطة حتى الإنجاز" },
];

export function StatsBand() {
  return (
    <section className="relative -mt-2 pb-6">
      <Container>
        <Reveal>
          <div className="card grid divide-y divide-clay-200 overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:[&>*]:border-0">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 px-6 py-8 text-center">
                <div className="text-[44px] font-bold leading-none tracking-tightest text-orange-gradient md:text-[52px]">
                  <Counter to={s.to} suffix={s.suffix} />
                </div>
                <p className="text-[14.5px] text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
