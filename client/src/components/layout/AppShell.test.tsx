import { describe, it, expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import AppShell from "./AppShell";
import { renderWithAuth } from "@/test/render";
import { PROFILE } from "@/test/fixtures";

const COLLAPSE_KEY = "velkor-sidebar-collapsed";

function renderShell() {
  renderWithAuth(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<div>DASHBOARD</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
    { user: PROFILE },
  );
}

describe("AppShell", () => {
  it("collapses the sidebar from a stored preference", () => {
    localStorage.setItem(COLLAPSE_KEY, "1");
    renderShell();
    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toBeInTheDocument();
    localStorage.removeItem(COLLAPSE_KEY);
  });

  it("toggles the sidebar with Ctrl+B and persists it", () => {
    renderShell();
    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(COLLAPSE_KEY)).toBe("1");
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(localStorage.getItem(COLLAPSE_KEY)).toBe("0");
  });

  it("renders the routed content through the outlet", () => {
    renderShell();
    expect(screen.getByText("DASHBOARD")).toBeInTheDocument();
  });

  it("opens the mobile menu", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      screen.getByRole("dialog", { name: "Navigation" }),
    ).toBeInTheDocument();
  });

  it("collapses the sidebar from the toolbar button", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    );
    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(COLLAPSE_KEY)).toBe("1");
  });
});
