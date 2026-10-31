import Image from "next/image";

/** Opening picture of article 908 in the style of the MUR poster: the banknote boat rocking on golden waves. */
export function MurHero() {
  return (
    <figure className="mur-hero">
      <svg className="mur-hero-sea" viewBox="0 0 800 120" preserveAspectRatio="none" aria-hidden>
        {[0, 1, 2, 3, 4].map((n) => (
          <path
            key={n}
            className={`mur-wave mur-wave-${n}`}
            d={`M-160 ${20 + n * 22}${Array.from({ length: 10 }, () => " q 40 -9 80 0 t 80 0").join("")}`}
          />
        ))}
      </svg>
      <Image
        src="/images/issue9/grai-marku-boat.webp"
        alt="Паперовий кораблик, складений із купюри «100», — символ вистави «Грай, [Марку]»"
        width={681}
        height={332}
        quality={90}
        sizes="(max-width: 640px) 78vw, 440px"
        className="mur-hero-boat"
      />
      <figcaption>Ілюстрація: творче об’єднання «МУР»</figcaption>
    </figure>
  );
}

/** The saying associated with Chykalenko (as the text above it says), set large in the poster's lettering between waves. */
export function MurQuote() {
  return (
    <figure className="mur-quote">
      <span className="mur-quote-waves" aria-hidden />
      <blockquote>
        <p className="mur-display">Любити Україну не до глибини душі, а до глибини власної кишені</p>
      </blockquote>
    </figure>
  );
}
