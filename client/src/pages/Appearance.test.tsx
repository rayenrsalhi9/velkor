import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/context/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/context/theme";
import { stubMatchMedia } from "@/test/match-media";
import AppearancePage from "./Appearance";

function renderAppearance() {
  return render(
    <ThemeProvider>
      <AppearancePage />
    </ThemeProvider>,
  );
}

describe("AppearancePage", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.unstubAllGlobals();
  });

  it("renders the three theme modes", () => {
    stubMatchMedia(false);
    renderAppearance();
    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System" })).toBeInTheDocument();
  });

  it("applies and persists the selected mode", async () => {
    stubMatchMedia(false);
    renderAppearance();

    await userEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("system mode tracks the OS preference", async () => {
    const mm = stubMatchMedia(false);
    renderAppearance();

    await userEvent.click(screen.getByRole("button", { name: "System" }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    act(() => mm.setMatches(true));
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => mm.setMatches(false));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
