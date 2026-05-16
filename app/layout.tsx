import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
<<<<<<< HEAD
  title: "County Budget Watchdog 🐕 — Nairobi City County",
  description:
    "AI-powered budget transparency tool for Nairobi City County. Ask questions about the KES 37.4B county budget, compare department allocations, and get ward-level breakdowns in plain language.",
  keywords: "Kenya, Nairobi, county budget, transparency, AI, watchdog, budget analysis",
=======
  title: "Budget Watchdog",
  description: "Plain-language access to Kenyan county budgets and gazette notices.",
>>>>>>> 1a82f0f1a1831c172a5fd0ac0eaf907983b9f4ca
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
