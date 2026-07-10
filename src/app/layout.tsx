import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Игорь Селицкий — биздев и техноэнтузиаст",
  description:
    "Личная страница Игоря Селицкого: опыт, pet‑проекты, заметки и веб‑эксперименты.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://selickiy.space'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
