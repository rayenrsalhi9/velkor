import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import TopBar from "./TopBar";
import { renderWithAuth } from "@/test/render";
import { PROFILE } from "@/test/fixtures";

function renderTopBar(path: string, props: Record<string, unknown> = {}) {
  const onMenu = vi.fn();
  const onToggleCollapse = vi.fn();
  const onOpenCommand = vi.fn();
  const utils = renderWithAuth(
    <MemoryRouter initialEntries={[path]}>
      <TopBar
        onMenu={onMenu}
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        onOpenCommand={onOpenCommand}
        {...props}
      />
    </MemoryRouter>,
    { user: PROFILE },
  );
  return { utils, onMenu, onToggleCollapse, onOpenCommand };
}

describe("TopBar", () => {
  it("shows breadcrumbs for the current route", () => {
    renderTopBar("/users");
    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("calls onMenu from the mobile menu button", async () => {
    const user = userEvent.setup();
    const { onMenu } = renderTopBar("/");
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(onMenu).toHaveBeenCalled();
  });

  it("calls onToggleCollapse from the collapse button", async () => {
    const user = userEvent.setup();
    const { onToggleCollapse } = renderTopBar("/");
    await user.click(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    );
    expect(onToggleCollapse).toHaveBeenCalled();
  });

  it("opens the command palette from the search field", async () => {
    const user = userEvent.setup();
    const { onOpenCommand } = renderTopBar("/");
    await user.click(screen.getByRole("button", { name: /Search or jump/ }));
    expect(onOpenCommand).toHaveBeenCalled();
  });
});
