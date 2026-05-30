import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/fonts";

const fontFamily = "IBM Plex Sans Arabic";
// Self-hosted (sandbox blocks Google Fonts over TLS); load weights from public/.
loadFont({ family: fontFamily, url: staticFile("fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2"), weight: "400" });
loadFont({ family: fontFamily, url: staticFile("fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2"), weight: "600" });
loadFont({ family: fontFamily, url: staticFile("fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2"), weight: "700" });

const ORANGE = "#F0851A";
const ORANGE_DEEP = "#DC6E0B";
const ORANGE_LIGHT = "#F6B877";
const INK = "#1A1714";
const PAPER = "#FBFAF7";

// Seamless loop: every motion is periodic over the full duration.
const TAU = Math.PI * 2;

const services = ["السباكة", "الكهرباء", "التكييف والتبريد"];

export const BrandLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = frame / durationInFrames; // 0..1
  const phase = t * TAU;

  // drifting warm blobs
  const blobAx = 0.32 + 0.04 * Math.sin(phase);
  const blobAy = 0.28 + 0.05 * Math.cos(phase);
  const blobBx = 0.72 + 0.05 * Math.cos(phase * 1.0);
  const blobBy = 0.74 + 0.04 * Math.sin(phase * 1.0);

  // logo gentle breathing
  const breathe = 1 + 0.025 * Math.sin(phase);
  const ringRot = t * 360;

  // soft intro that also settles back by the end for a clean loop
  const settle = interpolate(
    Math.sin(phase / 2),
    [0, 1],
    [0.85, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, fontFamily }}>
      {/* warm drifting washes */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(40% 40% at ${blobAx * 100}% ${blobAy * 100}%, rgba(240,133,26,0.16), transparent 70%),
                       radial-gradient(45% 45% at ${blobBx * 100}% ${blobBy * 100}%, rgba(246,184,119,0.18), transparent 72%)`,
        }}
      />

      {/* drifting dot grid (wraps for seamless loop) */}
      <DotGrid frame={frame} width={width} height={height} duration={durationInFrames} />

      {/* sweeping accent ring behind logo */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: "50%",
            transform: `rotate(${ringRot}deg)`,
            background: `conic-gradient(from 0deg, transparent 0deg, rgba(240,133,26,0.18) 40deg, transparent 110deg)`,
            opacity: 0.9,
          }}
        />
        {[0, 1, 2].map((i) => {
          const r = 300 + i * 70;
          const pulse = (Math.sin(phase - i * 0.7) + 1) / 2;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: r,
                height: r,
                borderRadius: "50%",
                border: `1.5px solid rgba(240,133,26,${0.06 + pulse * 0.12})`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* center brand stack */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 0 }}>
        <div style={{ transform: `scale(${breathe * settle})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Mark size={120} />
          <div
            style={{
              direction: "rtl",
              marginTop: 26,
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: INK,
              lineHeight: 1,
            }}
          >
            عدة
          </div>
          <div
            style={{
              direction: "rtl",
              marginTop: 18,
              fontSize: 40,
              fontWeight: 600,
              color: ORANGE_DEEP,
            }}
          >
            فنّيك في حيّك
          </div>
          <div
            style={{
              direction: "rtl",
              marginTop: 10,
              fontSize: 24,
              fontWeight: 400,
              color: "#756B5E",
            }}
          >
            صيانة منزلية في حي لبن — الرياض
          </div>
        </div>
      </AbsoluteFill>

      {/* service chips (continuous staggered shimmer) */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 90 }}>
        <div style={{ direction: "rtl", display: "flex", gap: 18 }}>
          {services.map((s, i) => {
            const shim = (Math.sin(phase * 1 - i * 0.9) + 1) / 2;
            return (
              <div
                key={s}
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  color: INK,
                  padding: "14px 30px",
                  borderRadius: 999,
                  background: "#fff",
                  border: `1px solid rgba(26,23,20,0.08)`,
                  boxShadow: `0 ${6 + shim * 10}px ${20 + shim * 16}px -12px rgba(240,133,26,${0.2 + shim * 0.35})`,
                }}
              >
                {s}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Mark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="loopCopper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={ORANGE_LIGHT} />
        <stop offset="1" stopColor={ORANGE_DEEP} />
      </linearGradient>
    </defs>
    <g fill="url(#loopCopper)">
      <path d="M54 12 L90 53 L73 67 L45 35 Z" />
      <path d="M54 12 L26 46 L44 46 L44 56 L62 56 L51 68 L33 68 L33 46 L45 35 Z" />
      <path d="M20 74 L44 74 L36 87 L12 87 Z" />
    </g>
  </svg>
);

const DotGrid: React.FC<{ frame: number; width: number; height: number; duration: number }> = ({
  frame,
  width,
  height,
  duration,
}) => {
  const spacing = 54;
  const drift = (frame / duration) * spacing; // full wrap over the loop
  const cols = Math.ceil(width / spacing) + 2;
  const rows = Math.ceil(height / spacing) + 2;
  const dots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * spacing - spacing + (drift % spacing);
      const y = r * spacing - spacing + (drift % spacing);
      dots.push(<circle key={`${r}-${c}`} cx={x} cy={y} r={1.6} fill="rgba(26,23,20,0.05)" />);
    }
  }
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      {dots}
    </svg>
  );
};
