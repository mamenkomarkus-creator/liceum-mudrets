import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { CATEGORIES, articles } from "@/lib/data";
import { STYLE_KINDS, type Layout } from "./layout";

export const claudeEnabled = () => !!process.env.ANTHROPIC_API_KEY;

const MODEL = "claude-opus-5-5";

/** Photo as Claude sees it: id for [фото:id] markers, plus the picture itself so it can pick the cover. */
export interface PhotoForClaude {
  id: string;
  name: string;
  data: Buffer;
}

export interface ClaudeInput {
  /** The author's text split into paragraphs (from Word or PDF). Claude only gets to classify them. */
  paragraphs: string[];
  /** The original PDF, as visual context for headings and captions; the text itself comes from `paragraphs`. */
  pdf: Buffer | null;
  fileName: string;
  photos: PhotoForClaude[];
  notes: string;
  uploadedBy: string;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "description",
    "category",
    "subcategory",
    "author",
    "authorLabel",
    "authorDescription",
    "coverPhotoId",
    "remove",
    "styles",
    "captions",
  ],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    category: { type: "string", enum: CATEGORIES },
    subcategory: { type: "string" },
    author: { type: "string" },
    authorLabel: { type: "string" },
    authorDescription: { type: "string" },
    coverPhotoId: { type: "string" },
    remove: { type: "array", items: { type: "integer" } },
    styles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["p", "kind"],
        properties: { p: { type: "integer" }, kind: { type: "string", enum: STYLE_KINDS } },
      },
    },
    captions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["p", "photoId"],
        properties: { p: { type: "integer" }, photoId: { type: "string" } },
      },
    },
  },
} as const;

/** Built once from the published articles, so it stays byte-identical between calls and is cached. */
function systemPrompt(): string {
  const authors = new Map<string, string>();
  for (const a of articles) {
    const name = a.author?.trim();
    if (name && a.authorProfile?.description) authors.set(name, a.authorProfile.description);
  }
  const latest = Math.max(...articles.map((a) => a.issue));
  const examples = articles
    .filter((a) => a.issue === latest)
    .slice(0, 3)
    .map((a) =>
      JSON.stringify(
        { title: a.title, description: a.description, category: a.category, subcategory: a.subcategory ?? "", author: a.author ?? "", authorLabel: a.authorLabel ?? "" },
        null,
        2
      )
    );

  return `Ти — випусковий редактор електронної газети «Ліцейський мудрець» Білоцерківського академічного ліцею «Мала академія наук». Учні й випускники надсилають статті у Word або PDF, а ти готуєш кожну до публікації на сайті.

## Головне правило
Текст статті ти НЕ пишеш і НЕ змінюєш. Тобі дають текст, розбитий на пронумеровані абзаци [1], [2], … Ти лише:
1. заповнюєш поля картки статті (назва, опис, рубрика, автор);
2. позначаєш номери абзаців, які є службовими й дублюють поля статті, щоб їх прибрати з тексту (remove);
3. вказуєш, яким елементом оформлення є абзац (styles);
4. вказуєш абзаци, що є підписами під фото (captions).
Сам текст абзаців буде взято з оригіналу дослівно — жодне слово, літера чи розділовий знак не зміниться.

## remove — лише службові абзаци
Прибрати можна тільки абзаци на початку або в кінці тексту, які дублюють поля: назву рубрики («ОБРІЇ»), заголовок статті, рядок з іменем автора («Олена Коваль, 10-Б», «Автор: …»), дату, номер випуску, коротку довідку про автора (її зміст переходить у authorDescription). Абзаци з основним текстом не прибирай ніколи. Якщо сумніваєшся — не прибирай.

## styles — оформлення абзаців
Вказуй лише ті абзаци, які не є звичайним текстом:
- heading — підзаголовок розділу; subheading — менший підзаголовок;
- quote — виокремлена цитата; note — примітка чи виноска редакції;
- greeting — звернення на початку колонки («Шановні читачі!»); signature — підпис наприкінці («Ваші …»);
- question / answer — питання й відповідь в інтерв'ю;
- paragraph — абзац, який у тексті виглядає як підзаголовок (починається з ## чи ###), але насправді є звичайним текстом.

## captions — підписи до фото
Якщо абзац одразу перед або після маркера [фото:ID] є підписом до цього фото (опис того, що на знімку), вкажи його номер і id фото: він стане підписом під фото дослівно.

## Поля
- title: заголовок статті точно так, як його написав автор (без лапок навколо, без назви рубрики).
- description: 1–2 речення для картки на головній — хто й про що пише, у третій особі (див. приклади). До 200 символів. Це єдиний текст, який пишеш ти.
- category: одна з рубрик: ${CATEGORIES.join(", ")}. «КОЛОНКА РЕДАКТОРА» — звернення редакції; «ЛІЦЕЙ» — події й життя ліцею; «ОБРІЇ» — історія, культура, профорієнтація, роздуми про світ; «ДІАЛОГИ ПРО НЕСКОРЕНИХ» — розмови про війну й людей, що її пережили; «ВИПУСКНИКИ» — про випускників і від них; «ВСТУПНИКАМ» — поради вступникам, НМТ; «РАДИМО ПРОЧИТАТИ» — книжкові поради.
- subcategory: підрубрика, якщо вона очевидна з тексту («Події», «Новий набір», «До Дня …»), інакше "".
- author: ім'я та прізвище автора (кількох — через кому) у формі «Ім'я Прізвище». Якщо автор уже писав для газети, пиши ім'я точно як у списку нижче. Якщо автора не видно, лиши "".
- authorLabel: «Автор статті», «Авторка статті», «Автори статті» або інше доречне («Авторка репортажу», «Авторка рубрики»). Якщо автора немає — "".
- authorDescription: коротка довідка про автора (клас, навчання, посада), якщо вона є в тексті або автор є у списку нижче; інакше "".
- coverPhotoId: id фото, найкращого для картки статті на головній (зазвичай перше змістовне фото), або "", якщо фото немає.

## Автори, які вже писали для газети
${[...authors].map(([name, d]) => `- ${name} — ${d}`).join("\n")}

## Приклади полів опублікованих статей
${examples.join("\n\n")}`;
}

let cachedSystem: string | null = null;

async function photoBlock(photo: PhotoForClaude): Promise<Anthropic.Beta.BetaImageBlockParam> {
  // Small previews are enough to understand what is in the picture and keep the request cheap.
  const jpeg = await sharp(photo.data).rotate().resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer();
  return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } };
}

/** Asks Claude for the article's card fields and the layout of its paragraphs. The text itself never comes from Claude. */
export async function layoutWithClaude(input: ClaudeInput): Promise<Layout> {
  cachedSystem ??= systemPrompt();
  const client = new Anthropic();

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.pdf) {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: input.pdf.toString("base64") } });
  }
  for (const photo of input.photos.slice(0, 20)) {
    content.push({ type: "text", text: `Фото id=${photo.id} (файл «${photo.name}»):` });
    content.push(await photoBlock(photo));
  }
  content.push({
    type: "text",
    text: [
      `Файл: «${input.fileName}». Завантажив(ла): ${input.uploadedBy}.`,
      input.notes ? `Примітка від редакції: ${input.notes}` : "",
      input.photos.length ? `Фото до статті: ${input.photos.map((p) => p.id).join(", ")}.` : "Фото до статті немає.",
      input.pdf ? "PDF вище — лише для того, щоб бачити, як виглядає стаття. Номери абзаців — у тексті нижче." : "",
      `Текст статті по абзацах:\n\n${input.paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n\n")}`,
      "Заповни поля й розмітку для цієї статті.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  const message = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: [{ type: "text", text: cachedSystem, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
    })
    .finalMessage();

  if (message.stop_reason === "refusal") throw new Error("Claude відмовився обробляти цей текст. Заповніть поля вручну.");
  if (message.stop_reason === "max_tokens") throw new Error("Claude не встиг відповісти повністю. Спробуйте ще раз.");
  const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const result = JSON.parse(text) as Layout;
  if (typeof result.title !== "string" || !Array.isArray(result.styles)) throw new Error("Claude повернув неповну відповідь");
  return result;
}

export function describeClaudeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return "Невірний ключ ANTHROPIC_API_KEY.";
  if (error instanceof Anthropic.RateLimitError) return "Claude зараз перевантажений або закінчились кошти на рахунку. Спробуйте за хвилину.";
  if (error instanceof Anthropic.BadRequestError) return `Claude не прийняв запит: ${error.message}`;
  if (error instanceof Anthropic.APIError) return `Помилка Claude API (${error.status ?? "мережа"}): ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}
