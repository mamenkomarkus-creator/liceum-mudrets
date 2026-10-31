import Image from "next/image";

export function ArticleImage({
  src,
  caption,
  alt,
  fit = "cover",
  unoptimized,
}: {
  src: string;
  caption?: string;
  alt?: string;
  fit?: "cover" | "contain" | "natural" | "small" | "plain" | "portrait" | "print" | "float-left" | "float-right";
  /** For the editorial preview, whose pictures are private drafts the image optimizer cannot fetch. */
  unoptimized?: boolean;
}) {
  const text = alt ?? caption?.split("\n")[0] ?? "";
  const float = fit === "float-left" || fit === "float-right";
  return (
    <figure className={float ? `img-float ${fit === "float-left" ? "img-float-left" : "img-float-right"}` : "my-9"}>
      {float || fit === "print" ? (
        // archival photo as a print: white margin and a soft shadow, never wider than the scan itself
        <Image
          unoptimized={unoptimized}
          src={src}
          alt={text}
          width={0}
          height={0}
          quality={90}
          sizes={float ? "(max-width: 640px) 100vw, 300px" : "(max-width: 520px) 100vw, 420px"}
          className={`img-print h-auto w-full ${fit === "print" ? "mx-auto max-w-[420px]" : ""}`}
        />
      ) : fit === "portrait" ? (
        <Image
          unoptimized={unoptimized}
          src={src}
          alt={text}
          width={0}
          height={0}
          sizes="240px"
          className="mx-auto h-auto w-full max-w-[240px] rounded-xl"
        />
      ) : fit === "plain" ? (
        <div className="relative mx-auto h-[min(112vw,520px)] w-full">
          <Image
            unoptimized={unoptimized}
            src={src}
            alt={text}
            fill
            sizes="(max-width: 800px) 100vw, 520px"
            className="object-contain drop-shadow-[0_14px_22px_rgba(20,28,48,0.25)]"
          />
        </div>
      ) : fit === "small" ? (
        <Image
          unoptimized={unoptimized}
          src={src}
          alt={text}
          width={0}
          height={0}
          sizes="(max-width: 520px) 100vw, 480px"
          className="mx-auto h-auto w-full max-w-[480px] rounded-xl"
        />
      ) : fit === "natural" ? (
        <Image
          unoptimized={unoptimized}
          src={src}
          alt={text}
          width={0}
          height={0}
          sizes="(max-width: 800px) 100vw, 760px"
          className="h-auto w-full rounded-xl"
        />
      ) : fit === "contain" ? (
        <div className="relative h-[min(112vw,540px)] w-full overflow-hidden rounded-xl bg-muted">
          <Image
            unoptimized={unoptimized}
            src={src}
            alt={text}
            fill
            sizes="(max-width: 800px) 100vw, 760px"
            className="object-contain p-4"
          />
        </div>
      ) : (
        <div className="relative w-full overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: "16 / 10" }}>
          <Image unoptimized={unoptimized} src={src} alt={text} fill sizes="(max-width: 800px) 100vw, 760px" className="object-cover" />
        </div>
      )}
      {caption ? (
        <figcaption
          className={`mx-auto mt-3 max-w-[34rem] text-sm leading-snug text-muted-foreground ${float ? "text-left" : "text-center"}`}
        >
          {caption.split("\n").map((line, i) =>
            i === 0 ? (
              <span key={i} className="block">
                {line}
              </span>
            ) : (
              <span key={i} className="mt-0.5 block text-xs italic opacity-80">
                {line}
              </span>
            )
          )}
        </figcaption>
      ) : null}
    </figure>
  );
}
