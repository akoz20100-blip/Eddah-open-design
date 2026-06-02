/**
 * Custom line-icons drawn for عدة. Single stroke weight, rounded joins —
 * consistent so the three services read as one family.
 */

type IconProps = {
  className?: string;
  strokeWidth?: number;
};

const base = (strokeWidth = 1.6) => ({
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function PlumbingIcon({ className, strokeWidth }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base(strokeWidth)}>
      {/* Pipe run with a wrench-style joint and a falling droplet */}
      <path d="M10 16h9a4 4 0 0 1 4 4v8a4 4 0 0 0 4 4h11" />
      <rect x="6" y="12" width="6" height="8" rx="1.5" />
      <rect x="36" y="28" width="6" height="8" rx="1.5" />
      <path d="M23 18.5h6" opacity="0.5" />
      <path d="M30 38c0 2-1.4 3.4-3 3.4S24 40 24 38c0-1.6 3-4.6 3-4.6S30 36.4 30 38Z" />
    </svg>
  );
}

export function ElectricalIcon({ className, strokeWidth }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base(strokeWidth)}>
      {/* Bolt inside a service shield/outline */}
      <path d="M26 6 13 27h9l-2 15 15-22h-9l2-12Z" />
      <path d="M8 14.5C10 11 13.5 9 17 9" opacity="0.45" />
      <path d="M40 33.5c-2 3.5-5.5 5.5-9 5.5" opacity="0.45" />
    </svg>
  );
}

export function CoolingIcon({ className, strokeWidth }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base(strokeWidth)}>
      {/* AC unit with airflow + a snowflake accent */}
      <rect x="7" y="12" width="34" height="13" rx="3" />
      <path d="M12 19h10" opacity="0.6" />
      <path d="M14 30c0 2.4 2 2.4 2 4.8M22 30c0 2.4 2 2.4 2 4.8" opacity="0.7" />
      <g opacity="0.95">
        <path d="M34 30v9M30 32.2l8 4.6M38 32.2l-8 4.6" />
      </g>
    </svg>
  );
}
