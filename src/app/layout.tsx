import type { Metadata } from "next";
import { Playfair_Display, Inter, Montserrat, Oswald } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionProvider } from "@/components/motion-provider";
import { SITE_URL } from "@/lib/site";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  preload: false,
});

const oswald = Oswald({
  variable: "--font-stencil",
  subsets: ["latin", "cyrillic"],
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ліцейський мудрець — Газета Білоцерківського академічного ліцею",
    template: "%s — Ліцейський мудрець",
  },
  description:
    "Орган Ліцейського братства Білоцерківського академічного ліцею «Мала академія наук». Новини, події, творчість ліцеїстів.",
  keywords: ["ліцей", "газета", "Біла Церква", "освіта", "ліцеїсти", "новини", "Ліцейський мудрець"],
  authors: [{ name: "Ліцейське братство" }],
  openGraph: {
    siteName: "Ліцейський мудрець",
    title: "Ліцейський мудрець",
    description:
      "Орган Ліцейського братства Білоцерківського академічного ліцею «Мала академія наук». Новини, події, творчість ліцеїстів.",
    type: "website",
    locale: "uk_UA",
    url: SITE_URL,
    images: [{ url: "/og-image.jpg", width: 1216, height: 640, alt: "Ліцейський мудрець — газета Білоцерківського академічного ліцею" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ліцейський мудрець",
    description: "Орган Ліцейського братства Білоцерківського академічного ліцею «Мала академія наук».",
    images: ["/og-image.jpg"],
  },
};

export const viewport = {
  themeColor: "#0f3a6e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${playfair.variable} ${inter.variable} ${oswald.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Перейти до змісту
        </a>
        <MotionProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </MotionProvider>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
