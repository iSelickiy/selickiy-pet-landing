import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Игорь Селицкий — портфолио",
  description:
    "Менеджер по развитию бизнеса. Строю мосты между бизнесом и технологиями — помогаю компаниям расти через CRM, программы лояльности и автоматизацию маркетинга.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="data-theme" defaultTheme="light">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
