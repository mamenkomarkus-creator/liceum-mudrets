export type Category =
  | "КОЛОНКА РЕДАКТОРА"
  | "ЛІЦЕЙ"
  | "ОБРІЇ"
  | "ДІАЛОГИ ПРО НЕСКОРЕНИХ"
  | "ВИПУСКНИКИ"
  | "ВСТУПНИКАМ"
  | "РАДИМО ПРОЧИТАТИ";

export interface AuthorProfile {
  name: string;
  photo?: string;
  photoPosition?: string;
  description?: string;
}

export interface ImageWithCaption {
  src: string;
  caption?: string;
  /** Text alternative for screen readers; defaults to the caption. */
  alt?: string;
  /** "contain" shows the whole picture (book covers, scans) instead of a 16:10 crop. */
  fit?: "cover" | "contain" | "natural" | "small" | "plain" | "portrait";
}

export interface LinkRef {
  url: string;
  title: string;
}

export interface QuizOption {
  label: string;
  text: string;
}

export interface QuizColumnItem {
  label: string;
  text: string;
}

export interface QuizMatchingPair {
  left: string;
  leftText: string;
  right: string;
  rightText: string;
}

export interface Quiz {
  id: number;
  title: string;
  question: string;
  type?: "matching";
  options: QuizOption[];
  correctLabel: string;
  explanation?: string;
  leftColumn?: QuizColumnItem[];
  rightColumn?: QuizColumnItem[];
  matchingPairs?: QuizMatchingPair[];
}

export interface Article {
  id: number;
  title: string;
  description: string;
  category: Category | string;
  subcategory?: string;
  date: string;
  issue: number;
  author?: string;
  authorLabel?: string;
  authorProfile?: AuthorProfile;
  /** Co-authored pieces: one card per person (takes precedence over authorProfile in the article page). */
  authorProfiles?: AuthorProfile[];
  /** People quoted in the text: referenced by a `> @id` first line of a block quote. */
  speakers?: Record<string, { name: string; role?: string; photo?: string; photoPosition?: string }>;
  image?: string;
  imagePosition?: string;
  imageFit?: "cover" | "contain";
  featuredImageSize?: "small" | "default";
  hideFeaturedImage?: boolean;
  infocardImage?: string;
  images?: string[];
  imagesCaption?: string;
  imagesWithCaptions?: ImageWithCaption[];
  youtubeLink?: string;
  youtubeLinks?: LinkRef[];
  pdfLink?: LinkRef;
  pdfLinks?: LinkRef[];
  quizzes?: Quiz[];
  showTridentAnimation?: boolean;
  content: string;
}
