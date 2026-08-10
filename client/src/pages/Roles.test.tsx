import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import RolesPage from "./Roles";
import { CLAIMS, ROLES, jsonResponse, stubApi } from "@/test/fixtures";

function renderPage() {
  return render(
    <MemoryRouter>
      <RolesPage />
    </MemoryRouter>,
  );
}

function listResponse(items: unknown[], total: number) {
  return jsonResponse(200, { items, total });
}

function rolesStub(url: string) {
  if (url.startsWith("/roles")) return listResponse(ROLES, 2);
  if (url.startsWith("/claims")) return jsonResponse(200, CLAIMS);
  return jsonResponse(404, { error: "nope" });
}

describe("RolesPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and lists roles", async () => {
    stubApi(rolesStub);
    renderPage();
    expect(await screen.findByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("1–2 of 2 roles")).toBeInTheDocument();
  });

  it("shows the empty state when there are no roles", async () => {
    stubApi((url) => {
      if (url.startsWith("/roles")) return listResponse([], 0);
      return jsonResponse(200, CLAIMS);
    });
    renderPage();
    expect(await screen.findByText("No roles yet")).toBeInTheDocument();
  });

  it("shows AccessDenied on a 403", async () => {
    stubApi(() => jsonResponse(403, { error: "Forbidden" }));
    renderPage();
    expect(await screen.findByText("You don't have access")).toBeInTheDocument();
  });

  it("shows an error with a retry button on failure", async () => {
    stubApi(() => jsonResponse(500, { error: "Server error" }));
    renderPage();
    expect(await screen.findByText("Server error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("opens the create drawer from the header button", async () => {
    stubApi(rolesStub);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /New role/ }));
    expect(
      await screen.findByText("Create a role and grant it permissions."),
    ).toBeInTheDocument();
  });

  it("refreshes the list from the refresh button", async () => {
    const fetchMock = vi.fn(rolesStub);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Editor");
    await user.click(screen.getByRole("button", { name: "Refresh roles" }));
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) => String(url).startsWith("/roles")),
      ).toHaveLength(2),
    );
  });

  it("searches roles by query", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith("/roles")) {
        const q = new URL(url, "http://x").searchParams.get("q") ?? "";
        const filtered = ROLES.filter((r) =>
          r.name.toLowerCase().includes(q.toLowerCase()),
        );
        return listResponse(filtered, filtered.length);
      }
      return jsonResponse(200, CLAIMS);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Editor");
    await user.type(screen.getByLabelText("Search roles"), "editor");
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes("q=editor")),
      ).toBe(true),
    );
    await vi.waitFor(() =>
      expect(screen.queryByText("Admin")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Editor")).toBeInTheDocument();
  });

  it("jumps back to the last valid page when the current page becomes empty", async () => {
    const manyRoles = Array.from({ length: 12 }, (_, i) => ({
      id: `r${i}`,
      name: `Role ${i}`,
      description: null,
      claims: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    }));
    let total = 12;
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith("/roles")) {
        const page = Number(new URL(url, "http://x").searchParams.get("page") ?? 1);
        const start = (page - 1) * 10;
        return jsonResponse(200, {
          items: manyRoles.slice(start, Math.min(start + 10, total)),
          total,
        });
      }
      if (url.startsWith("/claims")) return jsonResponse(200, CLAIMS);
      return jsonResponse(404, { error: "nope" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Role 0");
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await screen.findByText("Role 11");
    total = 10;
    await user.click(screen.getByRole("button", { name: "Refresh roles" }));
    await vi.waitFor(() =>
      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument(),
    );
    expect(screen.getByText("Role 0")).toBeInTheDocument();
    expect(screen.queryByText("No roles yet")).not.toBeInTheDocument();
  });
});
