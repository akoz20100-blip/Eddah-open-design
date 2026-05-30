import { cn } from "@/lib/cn";

/**
 * عدة wordmark + monogram. The mark is a hex "toolhead" with a copper
 * aperture — abstract enough to feel like a brand, not a clip-art wrench.
 */
export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center">
        <svg viewBox="0 0 40 40" className="h-9 w-9">
          <defs>
            <linearGradient id="logoCopper" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F2B978" />
              <stop offset="1" stopColor="#A85F2C" />
            </linearGradient>
          </defs>
          <path
            d="M20 2.5 34.7 11v18L20 37.5 5.3 29V11L20 2.5Z"
            fill="none"
            stroke="url(#logoCopper)"
            strokeWidth="1.8"
          />
          <path
            d="M20 11.5 28 16v8l-8 4.5L12 24v-8l8-4.5Z"
            fill="url(#logoCopper)"
            opacity="0.18"
          />
          <circle cx="20" cy="20" r="3.4" fill="none" stroke="url(#logoCopper)" strokeWidth="1.8" />
        </svg>
      </span>
      {showWord && (
        <span className="text-[22px] font-bold leading-none tracking-tight text-sand">
          عدة
        </span>
      )}
    </div>
  );
}
