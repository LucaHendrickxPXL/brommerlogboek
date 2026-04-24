"use client";

import { MantineColorScheme, MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { PropsWithChildren, Suspense } from "react";

import { FlashToast } from "@/components/ui/flash-toast";
import { ThemePreference } from "@/lib/theme-preference";
import { appTheme } from "@/lib/theme";

interface ProvidersProps extends PropsWithChildren {
  themePreference: ThemePreference;
}

export function Providers({ children, themePreference }: ProvidersProps) {
  const defaultColorScheme: MantineColorScheme = themePreference === "auto" ? "auto" : themePreference;
  const forceColorScheme = themePreference === "auto" ? undefined : themePreference;

  return (
    <MantineProvider
      theme={appTheme}
      defaultColorScheme={defaultColorScheme}
      forceColorScheme={forceColorScheme}
    >
      <DatesProvider settings={{ firstDayOfWeek: 1, locale: "nl" }}>
        {children}
        <Suspense fallback={null}>
          <FlashToast />
        </Suspense>
      </DatesProvider>
    </MantineProvider>
  );
}
