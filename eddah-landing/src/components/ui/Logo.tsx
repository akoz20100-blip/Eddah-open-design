import { cn } from "@/lib/cn";

/**
 * عدة brand mark — a bold peaked-roof monogram (home maintenance) with a
 * stepped inner cut and a detached base block, reinterpreting the brand logo
 * as clean vector so it stays crisp on dark surfaces and at any size.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="markCopper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6B877" />
          <stop offset="1" stopColor="#DC6E0B" />
        </linearGradient>
      </defs>
      <g fill="url(#markCopper)">
        {/* right roof slope — long clean diagonal from apex to lower-right */}
        <path d="M54 12 L90 53 L73 67 L45 35 Z" />
        {/* left roof slope — shorter, steeper, with a horizontal step (the "F" shelf) */}
        <path d="M54 12 L26 46 L44 46 L44 56 L62 56 L51 68 L33 68 L33 46 L45 35 Z" />
        {/* detached base block — slanted foot, lower-left */}
        <path d="M20 74 L44 74 L36 87 L12 87 Z" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="h-9 w-9 shrink-0" />
      {showWord && (
        <span className="text-[22px] font-bold leading-none tracking-tight text-ink">
          عدة
        </span>
      )}
    </div>
  );
}
