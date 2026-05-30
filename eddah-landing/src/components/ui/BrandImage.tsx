"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { BRAND_IMAGES, brandImageSrc, type BrandImageKey } from "@/lib/brandImages";

/**
 * Renders a brand creative from /public/brand. If the file isn't present yet,
 * it shows an elegant labelled placeholder so the layout always looks finished.
 *
 * Dark-toned originals get a brightening filter + a soft light scrim so they
 * match the bright عدة identity (per brand direction: keep it light, not moody).
 */
export function BrandImage({
  image,
  className,
  imgClassName,
  lighten,
  rounded = true,
  priority,
}: {
  image: BrandImageKey;
  className?: string;
  imgClassName?: string;
  /** Force the brightening treatment regardless of tone. */
  lighten?: boolean;
  rounded?: boolean;
  priority?: boolean;
}) {
  const meta = BRAND_IMAGES[image];
  const [failed, setFailed] = useState(false);
  const treat = lighten ?? meta.tone === "dark";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-clay-100",
        rounded && "rounded-[1.5rem]",
        className,
      )}
    >
      {!failed ? (
        <img
          src={brandImageSrc(image)}
          alt={meta.label}
          loading={priority ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full object-cover",
            treat && "brightness-[1.12] contrast-[0.96] saturate-[1.02]",
            imgClassName,
          )}
        />
      ) : (
        <Placeholder label={meta.label} />
      )}

      {/* light scrim to lift shadows on dark originals */}
      {treat && !failed && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/5" />
      )}
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-clay-100 via-white to-orange-50" />
      <div
        className="absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage:
            "radial-gradient(60% 60% at 70% 20%, rgba(240,138,29,0.14), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(26,23,20,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(26,23,20,0.05) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/70 text-orange-500 shadow-soft ring-1 ring-black/5">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <path d="m4 16 5-5 4 4 3-3 4 4" />
            <circle cx="9" cy="9" r="1.5" />
          </svg>
        </span>
        <span className="max-w-[16rem] text-[14px] font-semibold leading-snug text-ink-700">
          {label}
        </span>
        <span className="text-[11px] tracking-wide text-ink-400">صورة العلامة — تُضاف لاحقًا</span>
      </div>
    </div>
  );
}
