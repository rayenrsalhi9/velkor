import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme, THEME_STORAGE_KEY } from "@/context/theme";
import { stubMatchMedia } from "@/test/match-media";

function Probe() {
  const { theme, resolvedTheme, setTheme, toggle } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("light")}>light</button>
      <button onClick={() => setTheme("dark")}>dark</button>
      <button onClick={() => setTheme("system")}>system</button>
      <button onClick={toggle}>toggle</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to system and resolves to the OS theme", () => {
    stubMatchMedia(false);
    renderProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(isDark()).toBe(false);
  });

  it("resolves to dark when the OS prefers dark", () => {
    stubMatchMedia(true);
    renderProvider();
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(isDark()).toBe(true);
  });

  it("applies a stored preference on mount", () => {
    stubMatchMedia(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(isDark()).toBe(true);
  });

  it("persists and applies explicit themes", async () => {
    stubMatchMedia(false);
    renderProvider();
    await userEvent.click(screen.getByText("dark"));
    expect(isDark()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");

    await userEvent.click(screen.getByText("light"));
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("system mode tracks OS preference changes", async () => {
    const mm = stubMatchMedia(false);
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    renderProvider();
    expect(isDark()).toBe(false);

    act(() => mm.setMatches(true));
    expect(isDark()).toBe(true);
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");

    act(() => mm.setMatches(false));
    expect(isDark()).toBe(false);
  });

  it("toggle flips the resolved theme and persists", async () => {
    stubMatchMedia(false);
    renderProvider();
    await userEvent.click(screen.getByText("toggle"));
    expect(isDark()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    await userEvent.click(screen.getByText("toggle"));
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("falls back to system for an invalid stored value", () => {
    stubMatchMedia(false);
    localStorage.setItem(THEME_STORAGE_KEY, "neon");
    renderProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(isDark()).toBe(false);
  });
});
