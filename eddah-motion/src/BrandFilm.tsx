import {
  AbsoluteFill,
  Sequence,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { loadFont as loadArabic } from "@remotion/fonts";

const AR = "IBM Plex Sans Arabic";
const SERIF = "EB Garamond";

let fontsRequested = false;
function ensureFonts() {
  if (fontsRequested) return;
  fontsRequested = true;
  loadArabic({ family: AR, url: staticFile("fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2"), weight: "400" });
  loadArabic({ family: AR, url: staticFile("fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2"), weight: "600" });
  loadArabic({ family: AR, url: staticFile("fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2"), weight: "700" });
  loadArabic({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-400-normal.woff2"), weight: "400" });
}

const ORANGE_LIGHT = "#FFC74D";
const ORANGE_DEEP = "#DD6A06";

// scene timing (frames) — overlapping for crossfade
const D = 116; // per-photo scene length
const OVER = 16; // crossfade overlap

const photos = [
  { src: "brand/master.jpg", kx: -1, ky: -1 },
  { src: "brand/tools-float.jpg", kx: 1, ky: 1 },
  { src: "brand/products.jpg", kx: -1, ky: 1 },
];

export const BrandFilm: React.FC = () => {
  ensureFonts();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0E0A07" }}>
      {photos.map((p, i) => (
        <Sequence key={i} from={i * (D - OVER)} durationInFrames={D} layout="none">
          <PhotoScene src={p.src} kx={p.kx} ky={p.ky} dur={D} />
        </Sequence>
      ))}
      <Sequence from={3 * (D - OVER)} durationInFrames={120} layout="none">
        <LogoScene dur={120} />
      </Sequence>

      {/* persistent cinematic treatment */}
      <Grain />
      <Vignette />
      <BrandBug />
    </AbsoluteFill>
  );
};

const PhotoScene: React.FC<{ src: string; kx: number; ky: number; dur: number }> = ({ src, kx, ky, dur }) => {
  const frame = useCurrentFrame();
  const t = frame / dur;
  // Ken Burns: slow zoom + drift
  const scale = interpolate(t, [0, 1], [1.06, 1.16]);
  const tx = kx * interpolate(t, [0, 1], [0, 22]);
  const ty = ky * interpolate(t, [0, 1], [0, 18]);
  const opacity =
    interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(frame, [dur - 16, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* blurred fill background (covers 16:9 behind the portrait) */}
      <AbsoluteFill>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(34px) brightness(0.7)", transform: "scale(1.25)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "rgba(14,10,7,0.34)" }} />
      {/* sharp contained image with Ken Burns */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Img
          src={staticFile(src)}
          style={{
            height: "100%",
            maxWidth: "100%",
            objectFit: "contain",
            transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
            filter: "brightness(1.08) contrast(1.02)",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const LogoScene: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ease = 1 - Math.pow(1 - enter, 3);
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = 0.9 + ease * 0.1;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0E0A07" }}>
      <AbsoluteFill style={{ background: "radial-gradient(55% 60% at 50% 42%, rgba(242,130,12,0.22), transparent 70%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity, transform: `scale(${s})`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Mark size={112} />
          <div style={{ direction: "rtl", fontFamily: AR, fontWeight: 700, fontSize: 80, color: "#F7F2EA", marginTop: 22, letterSpacing: "-0.03em" }}>عدة</div>
          <div style={{ direction: "rtl", fontFamily: AR, fontWeight: 600, fontSize: 34, color: ORANGE_LIGHT, marginTop: 10 }}>فنّيك في حيّك</div>
          <div style={{ direction: "rtl", fontFamily: AR, fontWeight: 400, fontSize: 22, color: "#A89A86", marginTop: 14, letterSpacing: "0.06em" }}>حي لبن — الرياض</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(78% 78% at 50% 48%, transparent 56%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />
);

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame) % 12;
  return (
    <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const BrandBug: React.FC = () => (
  <div style={{ position: "absolute", top: 40, right: 48, display: "flex", alignItems: "center", gap: 10, opacity: 0.9 }}>
    <Mark size={30} />
    <span style={{ fontFamily: AR, fontWeight: 700, fontSize: 26, color: "#F7F2EA" }}>عدة</span>
  </div>
);

const Mark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="filmCopper2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={ORANGE_LIGHT} />
        <stop offset="1" stopColor={ORANGE_DEEP} />
      </linearGradient>
    </defs>
    <g fill="url(#filmCopper2)">
      <path d="M54 12 L90 53 L73 67 L45 35 Z" />
      <path d="M54 12 L26 46 L44 46 L44 56 L62 56 L51 68 L33 68 L33 46 L45 35 Z" />
      <path d="M20 74 L44 74 L36 87 L12 87 Z" />
    </g>
  </svg>
);
