import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme, THEME_STORAGE_KEY } from "@/context/theme";

function Probe() {
  const { theme, setTheme, toggle } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme("light")}>light</button>
      <button onClick={() => setTheme("dark")}>dark</button>
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
    vi.restoreAllMocks();
  });

  it("defaults to light", () => {
    renderProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(isDark()).toBe(false);
  });

  it("applies a stored preference on mount", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(isDark()).toBe(true);
  });

  it("persists and applies explicit themes", async () => {
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "dark" }));
    expect(isDark()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");

    await userEvent.click(screen.getByRole("button", { name: "light" }));
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("still applies an explicit theme when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage denied");
    });
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "dark" }));
    expect(isDark()).toBe(true);
  });

  it("toggle flips the theme and persists", async () => {
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(isDark()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    await userEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("falls back to light for an invalid stored value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon");
    renderProvider();
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(isDark()).toBe(false);
  });
});
