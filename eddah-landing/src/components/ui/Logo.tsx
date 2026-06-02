import { cn } from "@/lib/cn";
import { brandImageSrc } from "@/lib/brandImages";

const officialLogoMask = brandImageSrc("logoOfficial");

/**
 * Several contexts need the mark by itself. The official transparent logo
 * includes the Arabic word underneath, so this masks the top mark area and
 * recolors it with the brand gradient for light UI surfaces.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("block shrink-0", className)}
      aria-hidden
      style={{
        background: "linear-gradient(135deg, #F6B877 0%, #DC6E0B 100%)",
        display: "block",
        flexShrink: 0,
        width: "2.25rem",
        height: "2.25rem",
        WebkitMaskImage: `url('${officialLogoMask}')`,
        maskImage: `url('${officialLogoMask}')`,
        WebkitMaskPosition: "center 7%",
        maskPosition: "center 7%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "128% auto",
        maskSize: "128% auto",
      }}
    />
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
