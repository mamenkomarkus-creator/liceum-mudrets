// Schedule of the out-of-school unit «Мала академія наук» (printed programme of the 16.09.2026 conference).
export type School = "social" | "math" | "nature" | "philology";

export interface Lesson {
  school: School;
  teacher: string;
  title: string;
  day: "Понеділок" | "Вівторок" | "Середа" | "Четвер" | "П’ятниця" | "Субота";
  time: string;
  place: string;
}

export const SCHOOLS: Record<School, { name: string; color: string }> = {
  social: { name: "Школа суспільних дисциплін", color: "#2451c7" },
  math: { name: "Школа математичних та фізичних дисциплін", color: "#7c3aed" },
  nature: { name: "Природнича школа", color: "#2e9e5b" },
  philology: { name: "Школа філології", color: "#d97706" },
};

export const DAYS: Lesson["day"][] = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота"];

const BAL = "БАЛ «МАН»";

export const LESSONS: Lesson[] = [
  { school: "social", teacher: "Яременко Михайло Григорович", title: "Правознавство", day: "П’ятниця", time: "16.30", place: `${BAL}, ауд. №24` },
  { school: "social", teacher: "Яременко Ніна Володимирівна", title: "Соціологія", day: "П’ятниця", time: "16.30", place: `${BAL}, актова зала` },
  { school: "social", teacher: "Беник Ольга Никифорівна", title: "Історики-дослідники: історія України", day: "Четвер", time: "15.30", place: `${BAL}, ауд. №24` },
  { school: "social", teacher: "Бровко Наталія Іванівна", title: "Основи науково-дослідницької діяльності", day: "Субота", time: "11.00", place: `${BAL}, ауд. №21` },
  { school: "social", teacher: "Бурлака Сергій Іванович", title: "Краяни", day: "Субота", time: "10.40", place: `${BAL}, ауд. №12` },
  { school: "social", teacher: "Ягіяєв Ілля Ігорович", title: "Психологія", day: "Субота", time: "11.00", place: "ауд. №11" },

  { school: "math", teacher: "Ільченко Тетяна Анатоліївна", title: "Наукові дослідження у математиці", day: "Вівторок", time: "16.30", place: `${BAL}, ауд. №14` },
  { school: "math", teacher: "Грушник Оксана Іванівна", title: "Наукові дослідження у фізиці", day: "Четвер", time: "16.30", place: `${BAL}, ауд. №14` },
  { school: "math", teacher: "Козуб Ганна Олександрівна", title: "Інформатика та програмування", day: "Вівторок", time: "15.30", place: `${BAL}, ауд. №22` },
  { school: "math", teacher: "Новікова Вікторія Валеріївна", title: "Інтернет-технології і вебдизайн", day: "Субота", time: "11.00", place: "ауд. №14" },

  { school: "nature", teacher: "Поліщук Віталій Миколайович", title: "Хіміки-дослідники", day: "Середа", time: "16.30", place: "БНАУ корпус 9, ауд. 526" },
  { school: "nature", teacher: "Білопольська Тетяна Василівна", title: "Практична біологія", day: "Четвер", time: "16.30", place: `${BAL}, ауд. №11` },
  { school: "nature", teacher: "Познякова Світлана Василівна", title: "Географи-дослідники", day: "Вівторок", time: "16.30", place: `${BAL}, ауд. №21` },

  { school: "philology", teacher: "Бойко Лілія Борисівна", title: "Школа юного науковця (англійська мова)", day: "П’ятниця", time: "17.00", place: `${BAL}, ауд. №12` },
  { school: "philology", teacher: "Щаслива Наталія Святославівна", title: "Лінгвіст", day: "Понеділок", time: "16.20", place: `${BAL}, ауд. №12` },
  { school: "philology", teacher: "Терехов Володимир Франкович", title: "Філолог-дослідник", day: "Субота", time: "9.00", place: `${BAL}, ауд. №14` },
  { school: "philology", teacher: "Терехов Володимир Франкович", title: "Літературна творчість", day: "Субота", time: "10.40", place: `${BAL}, ауд. №14` },
  { school: "philology", teacher: "Терехова Ольга Олександрівна", title: "Основи журналістики", day: "Субота", time: "9.00", place: `${BAL}, ауд. №13` },
];

export const minutes = (t: string) => {
  const [h, m] = t.split(".").map(Number);
  return h * 60 + m;
};
