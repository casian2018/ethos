"use client";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "ethos-theme";

interface ThemeTarget {
  classList: {
    add: (...tokens: string[]) => void;
    remove: (...tokens: string[]) => void;
  };
  style?: {
    colorScheme?: string;
  };
}

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveInitialTheme(savedTheme: string | null | undefined, prefersDark: boolean): Theme {
  if (isTheme(savedTheme)) {
    return savedTheme;
  }

  return prefersDark ? "dark" : "light";
}

export function getNextTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}

export function applyThemeToTarget(theme: Theme, target: ThemeTarget | null | undefined) {
  if (!target) {
    return;
  }

  target.classList.remove("light", "dark");
  target.classList.add(theme);

  if (target.style) {
    target.style.colorScheme = theme;
  }
}
