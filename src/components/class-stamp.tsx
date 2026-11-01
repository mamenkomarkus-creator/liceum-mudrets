import { useId, type CSSProperties } from "react";

// Placement and look live here rather than in the stylesheet, so the stamp is right even before the CSS
// arrives (Safari likes to keep an old stylesheet in development); globals.css only adds the landing animation.
const STAMP: CSSProperties = {
  position: "absolute",
  top: "-2.75rem",
  right: "1rem",
  zIndex: 1,
  width: "4.6rem",
  height: "4.6rem",
  padding: "0.15rem",
  borderRadius: "999px",
  color: "#c8372b",
  background: "radial-gradient(closest-side, rgb(255 253 248 / 0.92) 88%, rgb(255 253 248 / 0) 100%)",
  transform: "rotate(-10deg)",
  pointerEvents: "none",
};

/**
 * Rubber stamp for the cards of articles written by one class (e.g. issue 9 by 11-А):
 * a small round seal in red ink, set at an angle where the photo meets the text.
 */
export function ClassStamp({ label, issue }: { label: string; issue: number }) {
  const id = useId().replace(/:/g, "");
  const ring = `ЛІЦЕЙСЬКИЙ МУДРЕЦЬ • ВИПУСК №${issue} • `;
  return (
    <span className="class-stamp" style={STAMP} aria-hidden>
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block", fontFamily: "var(--font-sans), Arial, sans-serif" }}>
        <defs>
          <path id={`${id}-ring`} d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0" />
          {/* a faint speckle where the ink did not take */}
          <filter id={`${id}-ink`}>
            <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="1" seed="7" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.45" result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="in" />
          </filter>
        </defs>
        <g filter={`url(#${id}-ink)`} fill="none" stroke="currentColor">
          <circle cx="50" cy="50" r="46" strokeWidth="2.6" />
          <circle cx="50" cy="50" r="42.5" strokeWidth="0.9" />
          <circle cx="50" cy="50" r="26" strokeWidth="1.3" />
          <text fill="currentColor" stroke="none" fontSize="8.6" fontWeight="700" letterSpacing="0.4">
            <textPath href={`#${id}-ring`} textLength="216" lengthAdjust="spacingAndGlyphs">
              {ring}
            </textPath>
          </text>
          <text x="50" y="54" textAnchor="middle" fill="currentColor" stroke="none" fontSize="17" fontWeight="800">
            {label}
          </text>
          <text x="50" y="65" textAnchor="middle" fill="currentColor" stroke="none" fontSize="6.6" fontWeight="700" letterSpacing="1.6">
            КЛАС
          </text>
        </g>
      </svg>
    </span>
  );
}
