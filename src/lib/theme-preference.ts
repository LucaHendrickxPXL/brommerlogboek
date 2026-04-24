export const themePreferences = ["auto", "light", "dark"] as const;

export type ThemePreference = (typeof themePreferences)[number];

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return themePreferences.includes(value as ThemePreference);
}
