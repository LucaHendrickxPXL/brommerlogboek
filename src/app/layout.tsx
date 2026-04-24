import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

import { DM_Sans, Sora } from "next/font/google";
import type { Metadata } from "next";
import { ColorSchemeScript } from "@mantine/core";

import { AppFrame } from "@/components/layout/app-frame";
import { Providers } from "@/app/providers";
import { getThemePreferenceFromCookie } from "@/server/auth";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Brommerlogboek",
    template: "%s | Brommerlogboek",
  },
  description: "Beheer kosten, ritten en onderhoud van je brommers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themePreference = await getThemePreferenceFromCookie();
  const defaultColorScheme = themePreference === "auto" ? "auto" : themePreference;
  const forceColorScheme = themePreference === "auto" ? undefined : themePreference;

  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <ColorSchemeScript
          defaultColorScheme={defaultColorScheme}
          forceColorScheme={forceColorScheme}
        />
      </head>
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <Providers key={themePreference} themePreference={themePreference}>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
