import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

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
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-zinc-50/50 text-zinc-900">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
