"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRevealOnce } from "@/lib/use-reveal-once";

// What is printed on the back cover (also exposed to screen readers, the photo text is small).
const BIO =
  "Федір Рудий. Поет, прозаїк, художник. Народився у місті Бровари на Київщині. Автор поетичної збірки «Після осені» і роману «Ковчег залишає пристань». Служив у піхоті 72 ОМБр (2023–2024 рр), був поранений. Нагороджений бригадною відзнакою «За оборону Вугледара». Переможець конкурсу короткої воєнної прози пам’яті Василя Паламарчука та призер конкурсів воєнної літератури «4.5.0» та воєнної поезії пам’яті Гліба Бабіча. Вірші перекладені англійською, французькою, німецькою, хорватською, литовською і грецькою мовами.";
const QUOTE =
  "Колись я вирішив, що більше не писатиму віршів. Але на війні стало очевидним, що деякі стани, досвіди й сенси можна описати лише в поетичній формі. І що інколи творчість — єдиний спосіб зберегти себе серед болю, відчаю, втрат. Більшість текстів цієї збірки написані на одній з піхотних позицій поблизу міста Вугледар. Тоді ж я начитав деякі з них на відео (ви можете переглянути їх за QR-кодами). Пізніше, вже у Краматорську, за допомогою пензля, чорної ручки і банки розчинної волонтерської кави, з’явилися й ілюстрації до книги. Така техніка видалася мені символічною, адже їхній колір нагадує легендарну донецьку глину і пахне спогадами про моменти затишшя, коли замерзлими пальцями стискаєш бляшану чашку з гарячим напоєм, коли, попри все, хочеш жити, і знаходиш прекрасне навіть на війні. Мені хотілося зберегти це відчуття.";

export function BookBack() {
  const [back, setBack] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  useRevealOnce(ref, () => setBack(true));

  return (
    <figure className="my-12">
      <div className="book-stage">
        <button
          ref={ref}
          type="button"
          className="bb"
          data-back={back}
          aria-pressed={back}
          aria-label={back ? "Показати передню обкладинку" : "Перегорнути книгу на задню обкладинку"}
          onClick={() => setBack((v) => !v)}
        >
          <span className="bb-shadow" aria-hidden />
          <span className="bb-scene">
            <span className="bb-cube">
              <span className="bb-face bb-front">
                <Image src="/images/issue8/book-cover.webp" alt="" fill sizes="440px" className="object-cover" />
              </span>
              <span className="bb-face bb-rear">
                <Image
                  src="/images/issue8/book-back.webp"
                  alt="Задня обкладинка збірки «Позиція. Поезія звідти»: фото автора в окопі, його коротка біографія й слова про книгу"
                  fill
                  sizes="440px"
                  className="object-cover"
                />
              </span>
              <span className="bb-face bb-spine" aria-hidden />
              <span className="bb-face bb-pages" aria-hidden />
              <span className="bb-face bb-top" aria-hidden />
              <span className="bb-face bb-bottom" aria-hidden />
            </span>
          </span>
        </button>
      </div>
      <div className="sr-only">
        <p>{BIO}</p>
        <p>{QUOTE}</p>
      </div>
      <figcaption className="mx-auto max-w-[34rem] text-center text-sm leading-snug text-muted-foreground">
        {back
          ? "Задня обкладинка збірки «Позиція. Поезія звідти»: про автора і його слова про книгу. Натисніть, щоб побачити передню."
          : "Збірка Федора Рудого «Позиція. Поезія звідти». Натисніть, щоб перегорнути на задню обкладинку."}
      </figcaption>
    </figure>
  );
}
