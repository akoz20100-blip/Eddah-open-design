"use client";

import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

/**
 * A hand-drawn, stylized "paper map" of west Riyadh.
 * حي لبن sits centre-frame as a glowing orange service zone with a dropped pin;
 * real neighbours (ظهرة لبن، طويق، العريجاء، نمار) are labelled around it and the
 * Western Ring Road runs down the east edge for geographic credibility.
 */

const blocks = [
  [60, 70, 70, 46], [140, 56, 60, 40], [212, 64, 54, 38],
  [70, 130, 56, 44], [430, 70, 64, 44], [500, 120, 60, 50],
  [470, 200, 58, 46], [500, 280, 56, 50], [120, 330, 60, 46],
  [70, 250, 50, 60], [200, 360, 64, 42], [300, 372, 70, 40],
  [392, 348, 60, 44], [452, 300, 48, 40],
];

const neighbours = [
  { t: "ظهرة لبن", x: 250, y: 70 },
  { t: "طويق", x: 420, y: 95 },
  { t: "العريجاء", x: 500, y: 235 },
  { t: "نمار", x: 300, y: 400 },
  { t: "الحزم", x: 110, y: 300 },
];

const LABAN =
  "M236 150 L360 138 Q404 150 410 196 L402 268 Q392 308 332 320 L256 326 Q206 318 196 268 L198 198 Q206 162 236 150 Z";

export function RiyadhMap() {
  return (
    <svg viewBox="0 0 600 460" className="h-full w-full" role="img" aria-label="خريطة توضّح تركيز خدمة عدة على حي لبن في غرب الرياض">
      <defs>
        <radialGradient id="zoneFill" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#F0851A" stopOpacity="0.34" />
          <stop offset="65%" stopColor="#F0851A" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#F0851A" stopOpacity="0.04" />
        </radialGradient>
        <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F0851A" stopOpacity="0.6" />
          <stop offset="1" stopColor="#DC6E0B" stopOpacity="0.25" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* paper base */}
      <rect width="600" height="460" fill="#F6F1E9" />

      {/* faint grid */}
      <g opacity="0.6">
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 48} y1="0" x2={i * 48} y2="460" stroke="#1A1714" strokeOpacity="0.04" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 48} x2="600" y2={i * 48} stroke="#1A1714" strokeOpacity="0.04" />
        ))}
      </g>

      {/* city blocks */}
      <g>
        {blocks.map(([x, y, w, h], i) => (
          <motion.rect
            key={i}
            x={x} y={y} width={w} height={h} rx="6"
            fill="#FFFFFF"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.75 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.04, duration: 0.8 }}
            stroke="#1A1714" strokeOpacity="0.06"
          />
        ))}
      </g>

      {/* roads */}
      <motion.path d="M468 30 L452 230 L470 440" fill="none" stroke="url(#roadGrad)" strokeWidth="6" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: EASE_OUT }} />
      <motion.path d="M40 200 L196 232 L410 220 L560 250" fill="none" stroke="url(#roadGrad)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 10"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EASE_OUT, delay: 0.2 }} />
      <text x="486" y="150" fill="#9A9082" fontSize="11" opacity="0.85" transform="rotate(86 486 150)">الدائري الغربي</text>

      {/* zone */}
      <path d={LABAN} fill="url(#zoneFill)" filter="url(#soft)" />
      <motion.path d={LABAN} fill="url(#zoneFill)" stroke="#DC6E0B" strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.8, ease: EASE_OUT, delay: 0.3 }} />

      {/* pulse rings */}
      {[0, 1].map((i) => (
        <motion.circle key={i} cx="303" cy="232" r="10" fill="none" stroke="#F0851A" strokeWidth="1.5"
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 3.2], opacity: [0.55, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: i * 1.5 }} style={{ transformOrigin: "303px 232px" }} />
      ))}

      {/* neighbour labels */}
      {neighbours.map((n) => (
        <motion.text key={n.t} x={n.x} y={n.y} fill="#756B5E" fontSize="13" textAnchor="middle"
          initial={{ opacity: 0 }} whileInView={{ opacity: 0.95 }} viewport={{ once: true }} transition={{ delay: 0.9, duration: 0.8 }}>
          {n.t}
        </motion.text>
      ))}

      {/* pin */}
      <motion.g initial={{ y: -28, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.1, type: "spring", stiffness: 220, damping: 14 }}>
        <ellipse cx="303" cy="262" rx="13" ry="4" fill="#1A1714" opacity="0.12" />
        <path d="M303 196 c-13 0 -23 10 -23 23 c0 16 23 37 23 37 c0 0 23 -21 23 -37 c0 -13 -10 -23 -23 -23 Z" fill="#F0851A" stroke="#DC6E0B" strokeWidth="1.5" />
        <circle cx="303" cy="219" r="7.5" fill="#FFFFFF" />
      </motion.g>

      {/* Laban chip */}
      <motion.g initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1.35, duration: 0.7 }}>
        <rect x="252" y="270" width="102" height="30" rx="15" fill="#FFFFFF" stroke="#F0851A" strokeOpacity="0.6" />
        <text x="303" y="290" fill="#1A1714" fontSize="15" fontWeight="700" textAnchor="middle">حي لبن</text>
      </motion.g>

      {/* compass */}
      <g opacity="0.7">
        <circle cx="556" cy="40" r="14" fill="#FFFFFF" stroke="#C3B6A1" strokeWidth="1" />
        <path d="M556 30 L560 42 L556 39 L552 42 Z" fill="#F0851A" />
        <text x="556" y="60" fill="#9A9082" fontSize="9" textAnchor="middle">ش</text>
      </g>
    </svg>
  );
}
