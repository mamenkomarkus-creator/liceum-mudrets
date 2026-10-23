import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { CATEGORIES, articles } from "@/lib/data";
import type { ArticleFields } from "./store";

export const claudeEnabled = () => !!process.env.ANTHROPIC_API_KEY;

const MODEL = "claude-opus-5-5";

/** Photo as Claude sees it: id for [фото:id] markers, plus the picture itself so it can write captions. */
export interface PhotoForClaude {
  id: string;
  name: string;
  data: Buffer;
}

export interface ClaudeInput {
  /** Markup converted from Word (with [фото:id] markers), or null when the source is a PDF. */
  markup: string | null;
  pdf: Buffer | null;
  fileName: string;
  photos: PhotoForClaude[];
  notes: string;
  uploadedBy: string;
}

export interface ClaudeResult extends ArticleFields {
  photoCaptions: { id: string; caption: string }[];
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
    "content",
    "coverPhotoId",
    "photoCaptions",
  ],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    category: { type: "string", enum: CATEGORIES },
    subcategory: { type: "string" },
    author: { type: "string" },
    authorLabel: { type: "string" },
    authorDescription: { type: "string" },
    content: { type: "string" },
    coverPhotoId: { type: "string" },
    photoCaptions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "caption"],
        properties: { id: { type: "string" }, caption: { type: "string" } },
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
        {
          title: a.title,
          description: a.description,
          category: a.category,
          subcategory: a.subcategory ?? "",
          author: a.author ?? "",
          authorLabel: a.authorLabel ?? "",
          content: a.content.slice(0, 1800) + (a.content.length > 1800 ? "\n…" : ""),
        },
        null,
        2
      )
    );

  return `Ти — випусковий редактор електронної газети «Ліцейський мудрець» Білоцерківського академічного ліцею «Мала академія наук». Учні й випускники надсилають статті у Word або PDF, а ти готуєш кожну до публікації на сайті.

## Головне правило
Текст автора не переписуй. Не скорочуй, не перефразовуй, не «покращуй» стиль, не додавай нових речень. Дозволено лише:
- прибрати з тексту службові рядки, які дублюють поля статті: назву рубрики, заголовок, підпис «Автор: …», дату, номер випуску, біографічну довідку про автора (її перенеси в authorDescription);
- виправити очевидні технічні огріхи: подвійні пробіли, розірвані переносами слова, зайві порожні рядки, прямі лапки "…" на «…», дефіс між словами на тире там, де потрібне тире;
- розмітити структуру (див. нижче).

## Розмітка поля content
Абзаци розділяються порожнім рядком. Доступно:
- \`## Підзаголовок\`, \`### Менший підзаголовок\` — лише там, де в тексті справді є підзаголовки;
- \`**жирний**\`, \`*курсив*\` — як у вихідному тексті;
- списки \`- пункт\` і \`1. пункт\`;
- \`> цитата\` — для виокремлених цитат (рядок \`— Ім'я\` всередині цитати стає підписом);
- \`!> текст\` — виноска / примітка редакції;
- \`^^ текст\` — велике привітання на початку колонки («Шановні читачі!»);
- \`%% текст\` — підпис наприкінці («Ваші …»);
- інтерв'ю: питання \`Q> текст питання\`, відповідь \`A> текст відповіді\` (кожне — окремим абзацом);
- \`---\` — розділювач між частинами;
- \`[фото:ID]\` — фото на окремому рядку. Маркери, що вже є в тексті, лиши на тих самих місцях. Окремо завантажені фото, яких у тексті немає, можна вставити туди, де вони доречні за змістом, або не вставляти — тоді вони підуть галереєю в кінці статті.
Інших тегів і HTML не використовуй.

## Поля
- title: заголовок статті, як його дав автор (без лапок навколо, без назви рубрики).
- description: 1–2 речення для картки на головній — хто й про що пише, у третій особі (див. приклади). До 200 символів.
- category: одна з рубрик: ${CATEGORIES.join(", ")}. «КОЛОНКА РЕДАКТОРА» — звернення редакції; «ЛІЦЕЙ» — події й життя ліцею; «ОБРІЇ» — історія, культура, профорієнтація, роздуми про світ; «ДІАЛОГИ ПРО НЕСКОРЕНИХ» — розмови про війну й людей, що її пережили; «ВИПУСКНИКИ» — про випускників і від них; «ВСТУПНИКАМ» — поради вступникам, НМТ; «РАДИМО ПРОЧИТАТИ» — книжкові поради.
- subcategory: підрубрика, якщо вона очевидна з тексту («Події», «Новий набір», «До Дня …»), інакше "".
- author: ім'я та прізвище автора (кількох — через кому) у формі «Ім'я Прізвище». Шукай у підписі чи заголовку файла. Якщо автор уже писав для газети, пиши ім'я точно як у списку нижче. Якщо автора не видно, лиши "".
- authorLabel: «Автор статті», «Авторка статті», «Автори статті» або інше доречне («Авторка репортажу», «Авторка рубрики»). Якщо автора немає — "".
- authorDescription: коротка довідка про автора (клас, навчання, посада), якщо вона є в тексті або автор є у списку нижче; інакше "".
- coverPhotoId: id фото, найкращого для картки статті на головній (зазвичай перше змістовне фото), або "", якщо фото немає.
- photoCaptions: підписи до фото — лише якщо підпис є у тексті поруч із фото або очевидний з контексту (не вигадуй імен людей на фото). Якщо підпису немає, не додавай цей елемент.

## Автори, які вже писали для газети
${[...authors].map(([name, d]) => `- ${name} — ${d}`).join("\n")}

## Приклади опублікованих статей (content обрізано)
${examples.join("\n\n")}`;
}

let cachedSystem: string | null = null;

async function photoBlock(photo: PhotoForClaude): Promise<Anthropic.Beta.BetaImageBlockParam> {
  // Small previews are enough to understand what is in the picture and keep the request cheap.
  const jpeg = await sharp(photo.data).rotate().resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer();
  return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } };
}

export async function formatWithClaude(input: ClaudeInput): Promise<ClaudeResult> {
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
      input.markup !== null ? `Текст статті (перетворений з Word):\n\n${input.markup}` : "Текст статті — у PDF вище.",
      "Підготуй статтю до публікації.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  const message = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: [{ type: "text", text: cachedSystem, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
    })
    .finalMessage();

  if (message.stop_reason === "refusal") throw new Error("Claude відмовився обробляти цей текст. Заповніть поля вручну.");
  if (message.stop_reason === "max_tokens") throw new Error("Стаття задовга для однієї обробки. Заповніть поля вручну.");
  const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const result = JSON.parse(text) as ClaudeResult;
  if (typeof result.content !== "string" || typeof result.title !== "string") throw new Error("Claude повернув неповну відповідь");
  return result;
}

export function describeClaudeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return "Невірний ключ ANTHROPIC_API_KEY.";
  if (error instanceof Anthropic.RateLimitError) return "Claude зараз перевантажений або закінчились кошти на рахунку. Спробуйте за хвилину.";
  if (error instanceof Anthropic.BadRequestError) return `Claude не прийняв запит: ${error.message}`;
  if (error instanceof Anthropic.APIError) return `Помилка Claude API (${error.status ?? "мережа"}): ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}
