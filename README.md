# Ліцейський мудрець

Електронна газета Білоцерківського академічного ліцею «Мала академія наук».
Next.js 16 (App Router) · React 19 · Tailwind CSS 4. Усі матеріали — у `src/data/articles.json`,
сайт повністю статичний (сторінки статей і авторів генеруються під час збірки).

## Запуск

```bash
npm install
npm run dev        # розробка, http://localhost:3100
npm run build      # продакшн-збірка
npm start          # продакшн-сервер (порт з PORT, за замовчуванням 3100)
npm run lint && npm run typecheck
```

## Публікація в інтернеті

Найпростіше — [Vercel](https://vercel.com) (безкоштовний тариф підходить):

1. Завантажте проєкт у GitHub-репозиторій і підключіть його у Vercel («Add New → Project»).
2. У налаштуваннях проєкту додайте змінні середовища (див. `.env.example`):
   - `NEXT_PUBLIC_SITE_URL` — адреса сайту без `/` в кінці, `https://liceum-mudrets.com.ua`;
   - `NEXT_PUBLIC_EDITORIAL_EMAIL` — пошта, на яку читачі надсилають статті.
3. Натисніть **Deploy**. Підключіть власний домен у розділі Domains і **після цього** змініть
   `NEXT_PUBLIC_SITE_URL` на справжню адресу та перезберіть сайт — від неї залежать `sitemap.xml`,
   `robots.txt`, канонічні посилання й попередній перегляд у соцмережах.
4. Надішліть `https://<ваш-домен>/sitemap.xml` у Google Search Console.

Підійде й будь-який Node-хостинг: `npm ci && npm run build && npm start`.

## Як додати новий випуск

1. У `src/lib/data.ts` додайте запис у `ISSUES` (`{ number: 9, dateLabel: "Жовтень 2026" }`).
2. Додайте статті в кінець `src/data/articles.json`: унікальний `id` (випуск 9 → 901, 902…), `issue`, `category`,
   `title`, `description`, `date`, `author`, `authorProfile` (ім'я, фото, опис), `content`, за потреби `image`
   (картка на головній), `images` та `imagesWithCaptions`.
3. Фото кладіть у `public/images/…` у форматі WebP/JPG (ширина до 1600 px). **Не замінюйте файл під тим самим
   ім'ям** — браузери й CDN кешують зображення; давайте новій версії нову назву.
4. Рубрики — у `CATEGORIES` (`src/lib/data.ts`) і типі `Category` (`src/lib/types.ts`).

### Розмітка тексту (`content`)

Абзаци розділяються порожнім рядком. Підтримується: `##`/`###` заголовки, `**жирний**`, `*курсив*`,
списки `- ` і `1. `, `---`, цитата `> текст`, виноска `!> текст`, велике привітання `^^ текст`, підпис `%% текст`,
питання й відповідь `Q> …` / `A> …`.

Блоки зі старого сайту: `[highlight]…[/highlight]`, `[question]…[/question]`, `[directspeech]…[/directspeech]`,
`[directspeech-photo:N:Ім'я, посада]…[/directspeech-photo]`, `[poem]`, `[preamble]`, `[day:1]`, `[dedication]`,
`[infocard]`, `[quote]`, `[center]`, `[articlelink:/article/110]Текст[/articlelink]`, `[facebooklink:url]`,
`[telegramlink:url]`, `[facebookvideo:url]`.

Зображення: `[images:3]`, `[images:0-2]` (ряд), `[carousel:0-5:Підпис]`, `[tour-gallery:0-9]`.
Цитата мовця з фото й посадою: опишіть його в полі `speakers` статті й почніть цитату з `> @id`.
Фото, не вставлені в текст, показуються галереєю в кінці статті.

## Що працює «лише в браузері читача»

Коментарі, закладки й голосування «Яка рубрика цікавіша?» зберігаються у `localStorage` і не потрапляють до редакції
(на сторінках про це сказано). Щоб зробити їх спільними, потрібен бекенд (наприклад, Supabase або Vercel KV).
Статті читачі надсилають електронною поштою (`mailto:`).

## Структура

- `src/app` — сторінки: головна, архів, стаття, автор, контакти, 404, `sitemap.ts`, `robots.ts`.
- `src/components` — шапка, підвал, картки, інтерактивні блоки статей (книга, слайд-шоу, програма-листівка).
- `src/lib/content.tsx` — перетворення розмітки тексту на React; `src/lib/data.ts` — доступ до даних.
- `public/decks/ns2026` — слайди презентації (HTML-фрагменти), `public/docs` — PDF.
