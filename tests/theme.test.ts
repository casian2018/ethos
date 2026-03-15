import test from "node:test";
import assert from "node:assert/strict";
import {
  applyThemeToTarget,
  getNextTheme,
  resolveInitialTheme,
} from "../lib/theme";

function createThemeTarget(initialTokens: string[] = []) {
  const tokens = new Set(initialTokens);

  return {
    tokens,
    target: {
      classList: {
        add: (...nextTokens: string[]) => {
          nextTokens.forEach((token) => tokens.add(token));
        },
        remove: (...nextTokens: string[]) => {
          nextTokens.forEach((token) => tokens.delete(token));
        },
      },
      style: {} as { colorScheme?: string },
    },
  };
}

test("resolveInitialTheme prefers saved theme over system preference", () => {
  assert.equal(resolveInitialTheme("dark", false), "dark");
  assert.equal(resolveInitialTheme("light", true), "light");
});

test("resolveInitialTheme falls back to system preference when no saved theme exists", () => {
  assert.equal(resolveInitialTheme(null, true), "dark");
  assert.equal(resolveInitialTheme(undefined, false), "light");
  assert.equal(resolveInitialTheme("unexpected", true), "dark");
});

test("getNextTheme toggles between light and dark", () => {
  assert.equal(getNextTheme("light"), "dark");
  assert.equal(getNextTheme("dark"), "light");
});

test("applyThemeToTarget replaces previous theme classes and updates color scheme", () => {
  const { tokens, target } = createThemeTarget(["light", "font-loaded"]);

  applyThemeToTarget("dark", target);

  assert.deepEqual([...tokens].sort(), ["dark", "font-loaded"]);
  assert.equal(target.style.colorScheme, "dark");
});
