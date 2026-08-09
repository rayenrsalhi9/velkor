import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { MemoryRouter } from "react-router";
import Sidebar from "./Sidebar";
import { renderWithAuth } from "@/test/render";

const DUMMY = {
  userId: "u1",
  email: "admin@velkor.local",
  fullName: "Admin User",
  role: "Admin",
};

function renderSidebar(
  claims: string[],
  over: Partial<ComponentProps<typeof Sidebar>> = {},
) {
  const onMobileClose = vi.fn();
  renderWithAuth(
    <MemoryRouter initialEntries={["/"]}>
      <Sidebar
        collapsed={false}
        mobileOpen={false}
        onMobileClose={onMobileClose}
        {...over}
      />
    </MemoryRouter>,
    { user: { ...DUMMY, claims } },
  );
  return { onMobileClose };
}

describe("Sidebar", () => {
  it("shows everything to wildcard users", () => {
    renderSidebar(["*"]);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All documents" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Roles" })).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("shows the users link only with both users:manage and roles:manage", () => {
    renderSidebar(["users:manage"]);
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    renderSidebar(["users:manage", "roles:manage"]);
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
  });

  it("hides all claimed sections from users without claims", () => {
    renderSidebar([]);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "All documents" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Roles" })).not.toBeInTheDocument();
  });

  it("renders section headings for claimed sections", () => {
    renderSidebar(["documents:view-list", "roles:manage"]);
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Administration")).toBeInTheDocument();
  });

  it("adds a title hint when collapsed", () => {
    renderSidebar(["*"], { collapsed: true });
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "title",
      "Users",
    );
  });

  it("opens the mobile drawer and closes it with Escape", () => {
    const { onMobileClose } = renderSidebar(["*"], { mobileOpen: true });
    expect(
      screen.getByRole("dialog", { name: "Navigation" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onMobileClose).toHaveBeenCalled();
  });
});
