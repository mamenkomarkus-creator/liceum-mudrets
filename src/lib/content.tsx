import React from "react";
import Link from "next/link";
import { ExternalLink, FileText, Send, Video } from "lucide-react";
import { AuthorAvatar } from "@/components/author-avatar";
import { ImageGallery } from "@/components/image-gallery";
import { renderInline } from "@/lib/inline";

export interface ContentImage {
  src: string;
  alt?: string;
  caption?: string;
  fit?: "cover" | "contain" | "natural" | "small" | "plain" | "portrait";
}

/** "3" -> [3], "0-5" -> [0..5] */
function parseRange(spec: string): number[] {
  const m = /^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(spec);
  if (!m) return [];
  const from = Number(m[1]);
  const to = m[2] ? Number(m[2]) : from;
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);
}

/** Image indices the text places itself (so the end-of-article gallery only shows the rest). */
export function extractImagePlaceholderIndices(content: string): Set<number> {
  const used = new Set<number>();
  for (const m of content.matchAll(/\[(?:images|tour-gallery):([\d-]+)\]/g)) parseRange(m[1]).forEach((n) => used.add(n));
  for (const m of content.matchAll(/\[(?:carousel|directspeech-photo):([\d-]+)(?::[^\]]*)?\]/g)) parseRange(m[1]).forEach((n) => used.add(n));
  return used;
}

const PAIRED =
  "highlight|question|directspeech-photo|directspeech|poem|preamble|day|dedication|infocard|quote|center|articlelink|facebooklink|telegramlink|facebookvideo";

interface Tagged {
  tag: string;
  arg: string;
  body: string;
}

/** Pulls [tag]…[/tag] blocks out of the text, leaving a one-line placeholder for each. */
function extractTagged(content: string): { text: string; store: Tagged[] } {
  const store: Tagged[] = [];
  const re = new RegExp(`\\[(${PAIRED})(?::([^\\]]*))?\\]([\\s\\S]*?)\\[\\/\\1\\]`, "g");
  const text = content.replace(re, (_m, tag: string, arg: string | undefined, body: string) => {
    store.push({ tag, arg: arg ?? "", body });
    return `\n\n§§B${store.length - 1}§§\n\n`;
  });
  return { text, store };
}

// Parses the lightweight markdown dialect used in the archived articles:
// headings, paragraphs, bold/italic emphasis, bullet/numbered lists,
// horizontal rules, "> " block quotes, "!> " callouts and [images:N] placeholders
// into the merged image list.
export function parseContentBlocks(
  content: string,
  images: ContentImage[] | undefined,
  renderImage: (image: ContentImage, index: number) => React.ReactNode,
  options: {
    inQuote?: boolean;
    /** Does a file under /public exist? Used to hide links to files that were never uploaded. */
    hasFile?: (publicPath: string) => boolean;
    embeds?: Record<string, React.ReactNode>;
    speakers?: Record<string, { name: string; role?: string; photo?: string; photoPosition?: string }>;
  } = {}
): React.ReactNode[] {
  const tagged = extractTagged(content.replace(/\r\n/g, "\n"));
  const lines = tagged.text.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockIndex = 0;

  const flushParagraph = (paraLines: string[]) => {
    const text = paraLines.join("\n").trim();
    if (!text) return;
    const isCite = options.inQuote && text.startsWith("— ");
    blocks.push(
      <p key={`p-${blockIndex++}`} className={isCite ? "quote-cite" : "whitespace-pre-line"}>
        {renderInline(text, `p-${blockIndex}`)}
      </p>
    );
  };

  function renderTagged(t: Tagged, key: string): React.ReactNode {
    const inner = (md: string) => parseContentBlocks(md.trim(), images, renderImage, { ...options });
    const text = t.body.trim();
    switch (t.tag) {
      case "highlight":
        return <aside className="callout callout-key">{inner(text)}</aside>;
      case "question":
        return (
          <div className="qa qa-q">
            <p>
              <span className="sr-only">Питання: </span>
              {renderInline(text, key)}
            </p>
          </div>
        );
      case "directspeech":
        return <blockquote className="speech">{inner(text.replace(/^-\s+/, ""))}</blockquote>;
      case "directspeech-photo": {
        const cut = t.arg.indexOf(":");
        const idx = Number(cut < 0 ? t.arg : t.arg.slice(0, cut));
        const caption = cut < 0 ? "" : t.arg.slice(cut + 1).trim();
        const [name, ...role] = caption.split(",");
        const photo = images?.[idx];
        return (
          <blockquote className="quote-card">
            <footer className="quote-card-head">
              <AuthorAvatar name={name?.trim() || undefined} photo={photo?.src} size={72} />
              <span>
                <cite className="quote-card-name">{name?.trim()}</cite>
                {role.length ? <span className="quote-card-role">{role.join(",").trim()}</span> : null}
              </span>
            </footer>
            <div className="quote-card-body">{inner(text)}</div>
          </blockquote>
        );
      }
      case "poem":
        return (
          <blockquote className="poem">
            <p className="whitespace-pre-line">{renderInline(text, key)}</p>
          </blockquote>
        );
      case "preamble":
        return <div className="preamble">{inner(text)}</div>;
      case "day":
        return <h2 className="day-heading">{renderInline(text, key)}</h2>;
      case "dedication":
        return <div className="dedication">{inner(text)}</div>;
      case "infocard":
        return <aside className="infocard">{inner(text)}</aside>;
      case "quote":
        return <p className="motto">{renderInline(text, key)}</p>;
      case "center":
        return <p className="text-center">{renderInline(text, key)}</p>;
      case "articlelink":
        return (
          <Link href={t.arg.trim()} className="alink">
            <span>{text}</span>
            <span aria-hidden>→</span>
          </Link>
        );
      case "facebooklink":
      case "telegramlink":
      case "facebookvideo": {
        const Icon = t.tag === "telegramlink" ? Send : t.tag === "facebookvideo" ? Video : ExternalLink;
        return (
          <a href={t.arg.trim()} target="_blank" rel="noopener noreferrer" className="elink">
            <Icon size={18} aria-hidden />
            {text}
          </a>
        );
      }
      default:
        return null;
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    const ph = trimmed.match(/^§§B(\d+)§§$/);
    if (ph) {
      const node = renderTagged(tagged.store[Number(ph[1])], `t${blockIndex}`);
      if (node) blocks.push(<React.Fragment key={`tag-${blockIndex}`}>{node}</React.Fragment>);
      blockIndex++;
      i++;
      continue;
    }

    const imgMatch = trimmed.match(/^\[images:([\d-]+)\]$/);
    if (imgMatch) {
      const idxs = parseRange(imgMatch[1]).filter((n) => images?.[n]);
      if (idxs.length === 1) {
        blocks.push(<React.Fragment key={`img-${blockIndex++}`}>{renderImage(images![idxs[0]], idxs[0])}</React.Fragment>);
      } else if (idxs.length > 1) {
        blocks.push(
          <div key={`imgs-${blockIndex++}`} className="img-row">
            {idxs.map((n) => (
              <React.Fragment key={n}>{renderImage(images![n], n)}</React.Fragment>
            ))}
          </div>
        );
      }
      i++;
      continue;
    }

    const gallery = trimmed.match(/^\[(carousel|tour-gallery):([\d-]+)(?::(.*))?\]$/);
    if (gallery) {
      const imgs = parseRange(gallery[2]).map((n) => images?.[n]).filter((x): x is ContentImage => !!x);
      if (imgs.length) {
        blocks.push(
          <ImageGallery
            key={`gal-${blockIndex++}`}
            images={imgs}
            title={gallery[3]?.trim() || (gallery[1] === "tour-gallery" ? "Фотогалерея" : undefined)}
          />
        );
      }
      i++;
      continue;
    }

    if (/^\[(profile-cards|sample-tasks)\]$/.test(trimmed)) {
      i++;
      continue;
    }

    const pres = trimmed.match(/^\[presentation:([^|\]]+)\|?([^\]]*)\]$/);
    if (pres) {
      const href = pres[1].trim();
      if (options.hasFile?.(href)) {
        blocks.push(
          <a key={`pres-${blockIndex++}`} href={href} target="_blank" rel="noopener noreferrer" className="elink">
            <FileText size={18} aria-hidden />
            {pres[2].trim() || "Презентація"}
          </a>
        );
      }
      i++;
      continue;
    }

    const embed = trimmed.match(/^\[embed:([\w-]+)\]$/);
    if (embed) {
      const node = options.embeds?.[embed[1]];
      if (node) blocks.push(<React.Fragment key={`embed-${blockIndex++}`}>{node}</React.Fragment>);
      i++;
      continue;
    }

    const qa = trimmed.match(/^([QA])>\s+(.*)$/);
    if (qa) {
      const isQ = qa[1] === "Q";
      blocks.push(
        <div key={`qa-${blockIndex++}`} className={`qa ${isQ ? "qa-q" : "qa-a"}`}>
          <p>
            <span className="sr-only">{isQ ? "Питання: " : "Відповідь: "}</span>
            {renderInline(qa[2], `qa-${blockIndex}`)}
          </p>
        </div>
      );
      i++;
      continue;
    }

    const styled = trimmed.match(/^(\^\^|>>|%%)\s+(.*)$/);
    if (styled) {
      const kind = { "^^": "lead", ">>": "pullquote", "%%": "signature" }[styled[1] as "^^" | ">>" | "%%"];
      blocks.push(
        kind === "pullquote" ? (
          <blockquote key={`pq-${blockIndex++}`} className="pullquote">
            <p>{renderInline(styled[2], `pq-${blockIndex}`)}</p>
          </blockquote>
        ) : (
          <p key={`${kind}-${blockIndex++}`} className={kind}>
            {renderInline(styled[2], `${kind}-${blockIndex}`)}
          </p>
        )
      );
      i++;
      continue;
    }

    if (/^!>\s/.test(trimmed)) {
      const text = trimmed.replace(/^!>\s+/, "");
      blocks.push(
        <aside key={`callout-${blockIndex++}`} className="callout">
          <p>{renderInline(text, `callout-${blockIndex}`)}</p>
        </aside>
      );
      i++;
      continue;
    }

    if (/^>(?!>)(\s|$)/.test(trimmed)) {
      const inner: string[] = [];
      while (i < lines.length && /^>(?!>)(\s|$)/.test(lines[i].trim())) {
        inner.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const who = inner[0]?.match(/^@([\w-]+)$/);
      const speaker = who ? options.speakers?.[who[1]] : undefined;
      if (speaker) {
        const body = inner.slice(1).join("\n").replace(/^\s+/, "");
        blocks.push(
          <blockquote key={`bq-${blockIndex++}`} className="quote-card">
            <footer className="quote-card-head">
              <AuthorAvatar name={speaker.name} photo={speaker.photo} position={speaker.photoPosition} size={72} />
              <span>
                <cite className="quote-card-name">{speaker.name}</cite>
                {speaker.role ? <span className="quote-card-role">{speaker.role}</span> : null}
              </span>
            </footer>
            <div className="quote-card-body">
              {parseContentBlocks(body, undefined, renderImage, { ...options, inQuote: true })}
            </div>
          </blockquote>
        );
        continue;
      }
      blocks.push(
        <blockquote key={`bq-${blockIndex++}`}>
          {parseContentBlocks(inner.join("\n"), undefined, renderImage, { ...options, inQuote: true })}
        </blockquote>
      );
      continue;
    }

    if (trimmed === "---") {
      blocks.push(<hr key={`hr-${blockIndex++}`} className="my-10 border-border" />);
      i++;
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.*)$/);
    if (h3) {
      blocks.push(
        <h3 key={`h3-${blockIndex++}`} className="mt-8 mb-3 font-display text-[1.375rem] font-bold leading-snug text-[#111]">
          {renderInline(h3[1], `h3-${blockIndex}`)}
        </h3>
      );
      i++;
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.*)$/);
    if (h2) {
      blocks.push(
        <h2 key={`h2-${blockIndex++}`} className="mt-12 mb-4 font-display text-[1.625rem] font-bold leading-tight text-[#111] md:text-[1.75rem]">
          {renderInline(h2[1], `h2-${blockIndex}`)}
        </h2>
      );
      i++;
      continue;
    }

    if (/^[-•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={`ul-${blockIndex++}`} className="list-disc pl-6 space-y-2 my-4 marker:text-primary">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `li-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={`ol-${blockIndex++}`} className="list-decimal pl-6 space-y-2 my-4 marker:text-primary marker:font-semibold">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `oli-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph: gather until blank line or next special block.
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(§§B\d+§§|\[(images|carousel|tour-gallery|profile-cards|sample-tasks|presentation|embed)(:[^\]]*)?\])$/.test(lines[i].trim()) &&
      lines[i].trim() !== "---" &&
      !/^!>\s/.test(lines[i].trim()) &&
      !/^[QA]>\s/.test(lines[i].trim()) &&
      !/^>(?!>)(\s|$)/.test(lines[i].trim()) &&
      !/^#{2,3}\s+/.test(lines[i].trim()) &&
      !/^[-•]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    flushParagraph(paraLines);
  }

  return blocks;
}
