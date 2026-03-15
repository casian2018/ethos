import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ethos - Your Fitness Journey",
  description: "Connect with fitness enthusiasts, track your workouts, and achieve your goals together.",
  keywords: ["fitness", "workout", "gym", "buddy", "community"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background">
        <LanguageProvider>
          {/* No Sidebar on landing page and auth pages */}
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
