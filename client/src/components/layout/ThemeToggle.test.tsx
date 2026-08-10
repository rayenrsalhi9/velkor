import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/context/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/context/theme";
import ThemeToggle from "./ThemeToggle";

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("starts in light mode and switches to dark on click", async () => {
    renderToggle();
    const button = screen.getByRole("button", {
      name: "Switch to dark mode",
    });
    await userEvent.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeInTheDocument();
  });

  it("starts in dark mode when a dark preference is stored", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderToggle();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeInTheDocument();
  });
});
