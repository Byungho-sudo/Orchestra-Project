import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import {
  getThemeConfigFromStoredFamily,
  THEME_FAMILY_COOKIE,
} from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Project dashboard with Tailwind CSS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeFamily = cookieStore.get(THEME_FAMILY_COOKIE)?.value;
  const initialTheme = getThemeConfigFromStoredFamily(themeFamily);

  return (
    <html
      lang="en"
      data-theme-family={initialTheme.family}
      data-theme-mode={initialTheme.mode}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider theme={initialTheme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
