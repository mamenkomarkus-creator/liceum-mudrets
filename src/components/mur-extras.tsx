"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PLACES, UKRAINE_PATHS, UKRAINE_VIEWBOX } from "@/data/ukraine-outline";

type Place = keyof typeof PLACES;

// The route of Chykalenko's life; every caption is from the text of article 908.
const STOPS: { place: Place; label: string; when?: string; text: string }[] = [
  { place: "pereshory", label: "Перешори", when: "1861", text: "Тут 21 грудня народився Євген Чикаленко — у заможній родині землевласників." },
  { place: "yelysavethrad", label: "Єлисаветград", text: "Навчання в Єлисаветградському реальному училищі." },
  { place: "kharkiv", label: "Харків", text: "Університет, звідки його виключили за участь в українському студентському русі." },
  {
    place: "pereshory",
    label: "Перешори",
    text: "Повертається господарювати в маєток. Успішний землевласник і агроном, він вкладає прибутки в українську культуру.",
  },
  {
    place: "kyiv",
    label: "Київ",
    when: "1906",
    text: "«Громадська думка», згодом «Рада». Щоб фінансувати газету, меценат заставляв будинок і продавав землю.",
  },
  {
    place: "west",
    label: "До Праги",
    when: "1929",
    text: "Після 1917 року — еміграція. У Чехословаччині працює над «Спогадами»; помирає 20 червня 1929 року в Празі.",
  },
];

// Gentle arcs between stops, bending to alternate sides, like a route drawn by hand.
function arc(a: { x: number; y: number }, b: { x: number; y: number }, bend: number) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  return `M${a.x} ${a.y}Q${(mx - dy * bend).toFixed(1)} ${(my + dx * bend).toFixed(1)} ${b.x} ${b.y}`;
}
const SEGMENTS = STOPS.slice(1).map((s, i) => arc(PLACES[STOPS[i].place], PLACES[s.place], i % 2 ? -0.16 : 0.16));
const ROUTE = SEGMENTS.map((d, i) => (i ? d.replace(/^M[^Q]+/, "") : d)).join("");

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Chykalenko's life as a journey on a map, after the course site of «Грай, [Марку]»: the map stays in place while
 * the reader scrolls, the banknote boat sails the dashed route from stop to stop, and each stop shows its caption.
 */
export function MurMap() {
  const wrap = useRef<HTMLDivElement>(null);
  const segs = useRef<(SVGPathElement | null)[]>([]);
  const start = PLACES[STOPS[0].place];
  const [view, setView] = useState({ k: 0, t: 0, x: start.x, y: start.y, angle: 0, travelled: 0, total: 1 });

  // scroll → which leg of the journey and how far along it (the boat rests at each stop for a while) → boat position
  useEffect(() => {
    const lengths = segs.current.map((p) => p?.getTotalLength() ?? 0);
    const total = lengths.reduce((a, b) => a + b, 0) || 1;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const u = clamp(-r.top / Math.max(1, r.height - innerHeight)) * (STOPS.length - 1);
      const k = Math.min(STOPS.length - 2, Math.floor(u));
      const t = clamp((u - k - 0.3) / 0.6);
      const path = segs.current[k];
      const len = lengths[k];
      if (!path || !len) return;
      const at = path.getPointAtLength(len * t);
      const ahead = path.getPointAtLength(Math.min(len, len * t + 1));
      const behind = path.getPointAtLength(Math.max(0, len * t - 1));
      const raw = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      // the boat leans into its course but never capsizes
      const angle = Math.max(-14, Math.min(14, Math.abs(raw) > 90 ? raw - Math.sign(raw) * 180 : raw));
      const travelled = lengths.slice(0, k).reduce((a, b) => a + b, 0) + len * t;
      setView({ k, t, x: at.x, y: at.y, angle, travelled, total });
    };
    const request = () => (frame ||= requestAnimationFrame(update));
    update();
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request);
    return () => {
      removeEventListener("scroll", request);
      removeEventListener("resize", request);
      cancelAnimationFrame(frame);
    };
  }, []);

  const active = view.t < 0.5 ? view.k : view.k + 1;
  const visited = new Set(STOPS.slice(0, (view.t >= 0.98 ? view.k + 1 : view.k) + 1).map((s) => s.place));
  const stop = STOPS[active];

  return (
    <div ref={wrap} className="mur-map-wrap" style={{ height: `${STOPS.length * 70 + 40}vh` }}>
      <div className="mur-map-sticky">
        <figure className="mur-map" aria-label="Карта: шлях Євгена Чикаленка">
          <svg viewBox={`0 0 ${UKRAINE_VIEWBOX.width} ${UKRAINE_VIEWBOX.height}`} role="img" aria-hidden>
            <defs>
              <mask id="mur-route-done">
                <path
                  d={ROUTE}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="10"
                  strokeDasharray={`${view.total} ${view.total}`}
                  strokeDashoffset={view.total - view.travelled}
                />
              </mask>
            </defs>
            {/* outline drawn twice, so the inner seams between the pieces disappear under the fill */}
            <g className="mur-map-land-edge">
              {UKRAINE_PATHS.map((d) => (
                <path key={d.slice(0, 24)} d={d} />
              ))}
            </g>
            <g className="mur-map-land">
              {UKRAINE_PATHS.map((d) => (
                <path key={d.slice(0, 24)} d={d} />
              ))}
            </g>
            <path d={ROUTE} className="mur-map-route" />
            <path d={ROUTE} className="mur-map-route mur-map-route-done" mask="url(#mur-route-done)" />
            {SEGMENTS.map((d, i) => (
              <path key={i} d={d} ref={(el) => void (segs.current[i] = el)} fill="none" stroke="none" />
            ))}
            {(Object.keys(PLACES) as Place[]).map((key) => {
              const p = PLACES[key];
              const west = key === "west";
              return (
                <g key={key} className="mur-map-place" data-visited={visited.has(key)} data-active={stop.place === key}>
                  {west ? (
                    <path d={`M${p.x + 14} ${p.y}h-26m8 -7l-8 7l8 7`} className="mur-map-arrow" />
                  ) : (
                    <circle cx={p.x} cy={p.y} r="7" />
                  )}
                  <text x={west ? p.x - 4 : p.x + 13} y={west ? p.y - 14 : p.y + 5}>
                    {west ? "до Праги" : p.name}
                  </text>
                </g>
              );
            })}
            <image
              href="/images/issue9/grai-marku-boat.webp"
              width="86"
              height="42"
              x={-43}
              y={-36}
              transform={`translate(${view.x} ${view.y}) rotate(${view.angle})`}
              className="mur-map-boat"
            />
          </svg>

          <div className="mur-map-card" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              >
                <span className="mur-map-card-title">
                  {stop.label}
                  {stop.when ? <span className="mur-map-card-when"> · {stop.when}</span> : null}
                </span>
                <span className="mur-map-card-text">{stop.text}</span>
              </motion.div>
            </AnimatePresence>
          </div>
          <figcaption className="mur-map-hint">
            {active + 1} / {STOPS.length} · гортайте
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
