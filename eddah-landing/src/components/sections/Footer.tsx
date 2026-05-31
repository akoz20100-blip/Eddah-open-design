import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { WhatsappIcon, PhoneIcon } from "@/components/icons/Icons";
import { whatsappLink, telLink } from "@/lib/brand";

const nav = [
  { href: "#services", label: "الخدمات" },
  { href: "#how", label: "كيف نشتغل" },
  { href: "#why", label: "ليش عدة" },
  { href: "#laban", label: "حي لبن" },
  { href: "#contact", label: "تواصل" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-clay-200 bg-clay-100/40 py-14">
      <Container>
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-orange-500 shadow-orange-glow ring-1 ring-orange-600/20">
                <img src="/brand/logo-eddah.png" alt="شعار عدة" className="h-full w-full object-contain p-1.5" />
              </span>
              <Logo showWord />
            </div>
            <p className="mt-4 text-[14.5px] leading-relaxed text-ink-500">
              صيانة منزلية منظّمة وسريعة في حي لبن بالرياض — سباكة، كهرباء، وتكييف.
              فنّيك في حيّك، تواصل وأبشر بالسعد.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-7 gap-y-3">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="text-[15px] text-ink-600 transition-colors hover:text-orange-600">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="واتساب"
              className="grid h-11 w-11 place-items-center rounded-full border border-clay-200 bg-white text-ink-600 transition-colors hover:border-orange-300 hover:text-orange-600">
              <WhatsappIcon className="h-5 w-5" />
            </a>
            <a href={telLink()} aria-label="اتصال"
              className="grid h-11 w-11 place-items-center rounded-full border border-clay-200 bg-white text-ink-600 transition-colors hover:border-orange-300 hover:text-orange-600">
              <PhoneIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-clay-200 pt-7 text-[13px] text-ink-400 md:flex-row">
          <p>© {new Date().getFullYear()} عدة. جميع الحقوق محفوظة.</p>
          <p>الرياض — حي لبن</p>
        </div>
      </Container>
    </footer>
  );
}
