import type { PaperPage } from "@/components/paper-flipbook";

// Jubilee issue 10 (November 2026): the four A3 pages of the printed newspaper, rendered from its print PDF.
// Page 4 carries the corrected editorial board (Mamenko and Shkoliar — editors, Terekhov — supervising editor).
const page = (n: number, alt: string): PaperPage => ({
  src: `/gazeta/10/page-${n}.webp`,
  full: `/gazeta/10/page-${n}-full.webp`,
  alt,
});

export const PAPER_10: PaperPage[] = [
  page(1, "Перша сторінка: «Нам 30 років, 1996–2026» — ювілейне слово Михайла Яременка та фото з життя ліцею за ці роки."),
  page(2, "Друга сторінка: «Слово про ліцейське слово» — колонка редакторів Марка Маменка й Данила Школяра, фото й перший випуск газети 1998 року."),
  page(3, "Третя сторінка: «Чия це ностальгія?» — спогади випускників і вчителів: «Дорогий ліцеїсте! Дорога ліцейна родино!», «Мої спогади», «Навчай дітей так, щоб вони могли навчити своїх дітей», «Цей ліцей і трохи довкола», «Місце моєї сили і добрих сил», «Грає в душі струна»."),
  page(4, "Четверта сторінка: «17 листопада — Міжнародний день студента»: «Для ліцеїстів — майбутніх студентів», «Мій ліцей, моя любов…», «Ліцей — моя сім’я», «Випадковість не випадкова!», «Моя історія!», «Передай канат через десять хат», вихідні дані газети."),
];
