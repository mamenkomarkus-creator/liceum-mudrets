import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

/** A picture found inside a Word file, before it is saved as a draft photo. */
export interface ExtractedImage {
  marker: string;
  data: Buffer;
  contentType: string;
}

/**
 * Word -> site markup. Keeps headings, bold/italic, lists and quotes; every embedded picture becomes
 * its own paragraph `[фото:<marker>]`, with the picture returned separately.
 */
export async function docxToMarkup(buffer: Buffer): Promise<{ markup: string; images: ExtractedImage[] }> {
  const images: ExtractedImage[] = [];
  const { value: html } = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const marker = `docx${images.length + 1}`;
        images.push({ marker, data: await image.readAsBuffer(), contentType: image.contentType });
        return { src: `photo:${marker}` };
      }),
    }
  );
  return { markup: htmlToMarkup(html), images };
}

/**
 * PDF text comes as visual lines without paragraph marks. A paragraph ends where a line is clearly shorter than a
 * full line of the page (last line of a paragraph, heading, signature); words broken by a hyphen are rejoined.
 * The words themselves are kept as they are.
 */
export async function pdfToText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  const paragraphs: string[] = [];
  for (const page of text) {
    const lines = page.split("\n").map((l) => l.trim()).filter(Boolean);
    const lengths = lines.map((l) => l.length).sort((a, b) => a - b);
    const fullLine = lengths[Math.floor(lengths.length * 0.8)] ?? 0;
    let current = "";
    for (const line of lines) {
      if (/^[–-]?\s*\d+\s*[–-]?$/.test(line)) continue; // page numbers
      current = current.endsWith("-") && /^\p{Ll}/u.test(line) ? current.slice(0, -1) + line : current ? `${current} ${line}` : line;
      if (line.length < fullLine * 0.8) {
        paragraphs.push(current);
        current = "";
      }
    }
    if (current) paragraphs.push(current);
  }
  return paragraphs.join("\n\n");
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

/**
 * Converts mammoth's HTML (flat, predictable: h1-h6, p, ul/ol/li, table, strong/em, a, img, br) into the
 * lightweight markup that src/lib/content.tsx renders.
 */
export function htmlToMarkup(html: string): string {
  const blocks: string[] = [];
  const listStack: { ordered: boolean; count: number }[] = [];
  let inline = "";
  let blockKind: "p" | "h" | "li" | "td" | null = null;
  let headingLevel = 0;
  let linkHref = "";
  let cellTexts: string[] = [];
  let rows: string[][] = [];

  const flushInline = (): string => {
    const text = tidyInline(inline);
    inline = "";
    return text;
  };

  const closeBlock = () => {
    const text = flushInline();
    if (!text) return;
    if (blockKind === "h") {
      blocks.push(`${headingLevel <= 2 ? "##" : "###"} ${stripEmphasis(text)}`);
    } else if (blockKind === "li") {
      const list = listStack[listStack.length - 1];
      const indent = "  ".repeat(Math.max(0, listStack.length - 1));
      blocks.push(`${indent}${list?.ordered ? `${++list.count}.` : "-"} ${text}`);
    } else if (blockKind === "td") {
      cellTexts.push(text);
    } else {
      blocks.push(paragraph(text));
    }
  };

  const tokens = html.split(/(<[^>]+>)/g);
  for (const token of tokens) {
    if (!token) continue;
    if (!token.startsWith("<")) {
      inline += decode(token);
      continue;
    }
    const m = /^<\s*(\/?)\s*([a-z0-9]+)([^>]*)>$/i.exec(token);
    if (!m) continue;
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const attrs = m[3];

    switch (tag) {
      case "p":
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        if (blockKind === "td") {
          if (closing && inline.trim()) inline += " ";
          break;
        }
        if (!closing) {
          if (blockKind === "li") closeBlock();
          blockKind = tag === "p" ? "p" : "h";
          headingLevel = tag === "p" ? 0 : Number(tag[1]);
        } else {
          closeBlock();
          blockKind = listStack.length ? "li" : null;
        }
        break;
      case "ul":
      case "ol":
        if (!closing) {
          if (blockKind === "li") closeBlock();
          listStack.push({ ordered: tag === "ol", count: 0 });
        } else {
          if (blockKind === "li") closeBlock();
          listStack.pop();
          blockKind = listStack.length ? "li" : null;
          if (!listStack.length) blocks.push("");
        }
        break;
      case "li":
        if (!closing) blockKind = "li";
        else closeBlock();
        break;
      case "table":
        if (!closing) rows = [];
        else {
          blocks.push(rows.map((r) => r.join(" — ")).filter(Boolean).join("\n"));
          blockKind = null;
        }
        break;
      case "tr":
        if (!closing) cellTexts = [];
        else rows.push(cellTexts);
        break;
      case "td":
      case "th":
        if (!closing) blockKind = "td";
        else {
          closeBlock();
          blockKind = null;
        }
        break;
      case "strong":
      case "b":
        inline += "**";
        break;
      case "em":
      case "i":
        inline += "*";
        break;
      case "br":
        inline += "\n";
        break;
      case "a":
        if (!closing) linkHref = /href="([^"]*)"/i.exec(attrs)?.[1] ?? "";
        else {
          // The site has no inline links; keep a visible address unless the text already is one.
          const href = decode(linkHref);
          if (href.startsWith("http") && !inline.includes(href)) inline += ` (${href})`;
          linkHref = "";
        }
        break;
      case "img": {
        const marker = /src="photo:([^"]+)"/i.exec(attrs)?.[1];
        if (marker) {
          const before = flushInline();
          if (before) blocks.push(blockKind === "h" ? `### ${stripEmphasis(before)}` : paragraph(before));
          blocks.push(`[фото:${marker}]`);
        }
        break;
      }
      default:
        break;
    }
  }
  if (inline.trim()) blocks.push(paragraph(flushInline()));

  return blocks
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^(\s*[-\d.]+ .*)\n\n(?=\s*[-\d.]+ )/gm, "$1\n")
    .trim();
}

/** Word authors often mark subheadings as a short bold line instead of a heading style. */
function paragraph(text: string): string {
  const bold = /^\*\*([^*]+)\*\*$/.exec(text);
  if (bold && bold[1].length <= 90 && !/[.:;]$/.test(bold[1])) return `### ${bold[1]}`;
  return text;
}

function stripEmphasis(text: string): string {
  return text.replace(/\*+/g, "").trim();
}

/** Merges the emphasis markers mammoth leaves around runs and spaces: `**a** **b**` -> `**a b**`. */
function tidyInline(text: string): string {
  return text
    .replace(/ /g, " ")
    .replace(/\*\*\*\*/g, "")
    .replace(/\*\*(\s+)\*\*/g, "$1")
    .replace(/(^|[^*])\*(\s+)\*(?!\*)/g, "$1$2")
    .replace(/\*\*(\s+)/g, (m, s: string, offset: number, all: string) => (isOpening(all, offset) ? `${s}**` : m))
    .replace(/(\s+)\*\*/g, (m, s: string, offset: number, all: string) => (isOpening(all, offset + s.length) ? m : `**${s}`))
    .replace(/\*\*\*\*/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

/** Is the `**` at this offset an opening marker (an even number of `**` before it)? */
function isOpening(all: string, offset: number): boolean {
  return (all.slice(0, offset).match(/\*\*/g)?.length ?? 0) % 2 === 0;
}
