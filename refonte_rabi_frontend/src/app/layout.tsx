import type { Metadata, Viewport } from "next";
import { Poppins, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { SiteChrome } from "@/components/SiteChrome";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// Police livresque réservée à la lecture immersive (ChapterReader) — le
// reste du site reste en Poppins.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rabipeknovel.com'),
  title: { default: 'RabipekNovel — Livres africains en ligne', template: '%s | RabipekNovel' },
  openGraph: { type: 'website', locale: 'fr_FR', siteName: 'RabipekNovel' },
  twitter: { card: 'summary_large_image' },
  description: "Librairie numérique Rabipek",
};

// `viewportFit: 'cover'` est indispensable pour que `env(safe-area-inset-*)`
// résolve à autre chose que 0 sur iOS (notch/Dynamic Island/barre d'accueil) —
// sans ça, MobileTopBar/MobileBottomNav ignorent la zone système et leurs
// boutons peuvent se retrouver sous l'encoche, hors de portée du tap réel.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applique la classe `.dark` sur <html> avant tout rendu React, en lisant le
// choix sauvegardé (localStorage) ou, à défaut, la préférence système. Évite
// le flash d'un mauvais thème au chargement (FOUC). Doit rester synchrone et
// être le tout premier contenu du <body> pour bloquer le rendu jusqu'à son
// exécution.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var isDark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${lora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
