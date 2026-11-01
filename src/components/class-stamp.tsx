import { useId } from "react";

/**
 * Rubber stamp for the cards of articles written by one class (e.g. issue 9 by 11-А):
 * a round seal in red ink, a little worn, set at an angle where the photo meets the text.
 */
export function ClassStamp({ label, issue }: { label: string; issue: number }) {
  const id = useId().replace(/:/g, "");
  const ring = `ЛІЦЕЙСЬКИЙ МУДРЕЦЬ • ВИПУСК №${issue} • `;
  return (
    <span className="class-stamp" aria-hidden>
      <svg viewBox="0 0 100 100">
        <defs>
          <path id={`${id}-ring`} d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" />
          {/* speckles where the ink did not take, and slightly rough edges */}
          <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.55" result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="in" result="worn" />
            <feTurbulence type="turbulence" baseFrequency="0.6" numOctaves="1" seed="3" result="warp" />
            <feDisplacementMap in="worn" in2="warp" scale="1.2" />
          </filter>
        </defs>
        <g filter={`url(#${id}-ink)`} fill="none" stroke="currentColor">
          <circle cx="50" cy="50" r="46" strokeWidth="3" />
          <circle cx="50" cy="50" r="27" strokeWidth="1.6" />
          <text fill="currentColor" stroke="none" fontSize="9.4" fontWeight="700" letterSpacing="0.6">
            <textPath href={`#${id}-ring`} textLength="222" lengthAdjust="spacingAndGlyphs">
              {ring}
            </textPath>
          </text>
          <text x="50" y="53" textAnchor="middle" fill="currentColor" stroke="none" fontSize="19" fontWeight="800">
            {label}
          </text>
          <text x="50" y="66" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7.5" fontWeight="700" letterSpacing="1.6">
            КЛАС
          </text>
        </g>
      </svg>
    </span>
  );
}
