import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
  random,
} from "remotion";
import { loadFont as loadArabic } from "@remotion/fonts";

const AR = "IBM Plex Sans Arabic";
const SERIF = "EB Garamond";

// Load fonts inside render context (staticFile is undefined at module-eval).
let fontsRequested = false;
function ensureFonts() {
  if (fontsRequested) return;
  fontsRequested = true;
  loadArabic({ family: AR, url: staticFile("fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2"), weight: "400" });
  loadArabic({ family: AR, url: staticFile("fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2"), weight: "600" });
  loadArabic({ family: AR, url: staticFile("fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2"), weight: "700" });
  loadArabic({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-400-normal.woff2"), weight: "400" });
  loadArabic({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-500-normal.woff2"), weight: "500" });
}

const ORANGE = "#F0851A";
const ORANGE_LIGHT = "#F6B877";
const ORANGE_DEEP = "#DC6E0B";

const EASE = (t: number) => 1 - Math.pow(1 - t, 3); // expo-ish out

export const BrandFilm: React.FC = () => {
  ensureFonts();
  return (
    <AbsoluteFill style={{ backgroundColor: "#100B07" }}>
      <Backdrop />
      <Grain />
      <Vignette />

      <Sequence from={0} durationInFrames={96} layout="none">
        <Caption ar="صاحب المهمات المستحيلة" en="The man for the impossible jobs" />
      </Sequence>
      <Sequence from={90} durationInFrames={96} layout="none">
        <Caption ar="دقّة لا تغلط" en="Precision that never misses" />
      </Sequence>
      <Sequence from={180} durationInFrames={96} layout="none">
        <Caption ar="ثقة لا تتسرّب" en="Trust that never leaks" />
      </Sequence>
      <Sequence from={276} durationInFrames={84} layout="none">
        <LogoScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = (frame / durationInFrames) * Math.PI * 2;
  // slow cinematic camera drift + breathing warm rim light
  const gx = 64 + 10 * Math.sin(p);
  const gy = 32 + 8 * Math.cos(p * 0.8);
  const zoom = 1.06 + 0.04 * Math.sin(p * 0.5);
  // light-leak sweep position (loops)
  const leak = ((frame / durationInFrames) * 160 - 30);
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <AbsoluteFill style={{ backgroundColor: "#100B07" }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(50% 60% at ${gx}% ${gy}%, rgba(240,133,26,0.30), rgba(240,133,26,0.06) 45%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(40% 50% at 20% 90%, rgba(220,110,11,0.16), transparent 65%)`,
        }}
      />
      {/* warm light-leak streak */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(115deg, transparent ${leak - 14}%, rgba(246,184,119,0.16) ${leak}%, transparent ${leak + 14}%)`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(75% 75% at 50% 48%, transparent 55%, rgba(0,0,0,0.55) 100%)",
      pointerEvents: "none",
    }}
  />
);

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame) % 12; // re-seed for live grain flicker
  return (
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`grain${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ ar: string; en: string }> = ({ ar, en }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = interpolate(frame, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = EASE(enter) * exit;
  const y = (1 - EASE(enter)) * 24;
  const blur = (1 - EASE(enter)) * 10;
  const lineW = interpolate(frame, [10, 40], [0, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: o, transform: `translateY(${y}px)`, filter: `blur(${blur}px)` }}>
        <div style={{ direction: "rtl", fontFamily: AR, fontWeight: 700, fontSize: 86, color: "#F7F2EA", letterSpacing: "-0.02em", textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}>
          {ar}
        </div>
        <div style={{ height: 2, width: lineW, margin: "22px auto", background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)` }} />
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontStyle: "italic", fontSize: 30, color: ORANGE_LIGHT, letterSpacing: "0.04em" }}>
          {en}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = interpolate(frame, [0, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [durationInFrames - 22, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = EASE(enter) * exit;
  const s = 0.9 + EASE(enter) * 0.1;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: o, transform: `scale(${s})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Mark size={108} />
        <div style={{ direction: "rtl", fontFamily: AR, fontWeight: 700, fontSize: 78, color: "#F7F2EA", marginTop: 22, letterSpacing: "-0.03em" }}>عدة</div>
        <div style={{ direction: "rtl", fontFamily: AR, fontWeight: 600, fontSize: 34, color: ORANGE_LIGHT, marginTop: 10 }}>فنّيك في حيّك</div>
        <div style={{ direction: "rtl", fontFamily: AR, fontWeight: 400, fontSize: 22, color: "#A89A86", marginTop: 14, letterSpacing: "0.06em" }}>حي لبن — الرياض</div>
      </div>
    </AbsoluteFill>
  );
};

const Mark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="filmCopper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={ORANGE_LIGHT} />
        <stop offset="1" stopColor={ORANGE_DEEP} />
      </linearGradient>
    </defs>
    <g fill="url(#filmCopper)">
      <path d="M54 12 L90 53 L73 67 L45 35 Z" />
      <path d="M54 12 L26 46 L44 46 L44 56 L62 56 L51 68 L33 68 L33 46 L45 35 Z" />
      <path d="M20 74 L44 74 L36 87 L12 87 Z" />
    </g>
  </svg>
);
