import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ethos",
  description: "Athletic training, nutrition, recovery, and community in one distinctive fitness product.",
  keywords: ["fitness", "workout", "gym", "buddy", "community"],
};

const themeInitScript = `
  (() => {
    try {
      const savedTheme = window.localStorage.getItem("ethos-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : (prefersDark ? "dark" : "light");
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${cormorantGaramond.variable} light`}
      suppressHydrationWarning
    >
      <body className="ethos-root min-h-screen font-sans antialiased bg-background text-foreground">
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
