import { useEffect, useRef, type RefObject } from "react";

/**
 * Calls `onReveal` once, when at least `ratio` of the element is on screen.
 * IntersectionObserver is the main trigger; a scroll check covers environments that throttle it.
 */
export function useRevealOnce(ref: RefObject<HTMLElement | null>, onReveal: () => void, ratio = 0.6) {
  const done = useRef(false);
  const callback = useRef(onReveal);
  useEffect(() => {
    callback.current = onReveal;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([e]) => e.isIntersecting && reveal(), { threshold: ratio })
        : null;

    function cleanup() {
      io?.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    }
    function reveal() {
      if (done.current) return;
      done.current = true;
      cleanup();
      callback.current();
    }
    function check() {
      const r = el!.getBoundingClientRect();
      const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      if (visible >= r.height * ratio) reveal();
    }

    io?.observe(el);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();
    return cleanup;
  }, [ref, ratio]);

  return done;
}
