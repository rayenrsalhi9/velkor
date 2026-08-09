import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import UsersPage from "./Users";
import { USERS, jsonResponse, stubApi } from "@/test/fixtures";

function renderPage() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>,
  );
}

function listResponse(items: unknown[], total: number) {
  return jsonResponse(200, { items, total });
}

describe("UsersPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and lists users", async () => {
    stubApi((url) => {
      if (url.startsWith("/users")) return listResponse(USERS, 2);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    expect(await screen.findByText("Sara Mansour")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("1–2 of 2 users")).toBeInTheDocument();
  });

  it("shows the empty state when there are no users", async () => {
    stubApi(() => listResponse([], 0));
    renderPage();
    expect(await screen.findByText("No users yet")).toBeInTheDocument();
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

  it("opens the create dialog from the header button", async () => {
    stubApi((url) => {
      if (url.startsWith("/users")) return listResponse(USERS, 2);
      if (url.startsWith("/roles")) return listResponse([], 0);
      return jsonResponse(404, { error: "nope" });
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /New user/ }));
    expect(
      await screen.findByText("Create a user account with a company email."),
    ).toBeInTheDocument();
  });

  it("refreshes the list from the refresh button", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith("/users")) return listResponse(USERS, 2);
      return jsonResponse(404, { error: "nope" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Sara Mansour");
    await user.click(screen.getByRole("button", { name: "Refresh users" }));
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) => String(url).startsWith("/users")),
      ).toHaveLength(2),
    );
  });

  it("searches users by query", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith("/users")) {
        const q = new URL(url, "http://x").searchParams.get("q") ?? "";
        const filtered = USERS.filter((u) =>
          u.fullName.toLowerCase().includes(q.toLowerCase()),
        );
        return listResponse(filtered, filtered.length);
      }
      return jsonResponse(404, { error: "nope" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Sara Mansour");
    await user.type(screen.getByLabelText("Search users"), "sara");
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes("q=sara")),
      ).toBe(true),
    );
    expect(screen.getByText("Sara Mansour")).toBeInTheDocument();
    expect(screen.queryByText("Admin User")).not.toBeInTheDocument();
  });

  it("sorts by role when the Role header is clicked", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith("/users")) return listResponse(USERS, 2);
      return jsonResponse(404, { error: "nope" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Sara Mansour");
    await user.click(screen.getByRole("button", { name: "Sort by Role" }));
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).includes("sortBy=role&order=asc"),
        ),
      ).toBe(true),
    );
  });

  it("paginates to the next page", async () => {
    const manyUsers = Array.from({ length: 12 }, (_, i) => ({
      id: `u${i}`,
      email: `user${i}@velkor.local`,
      fullName: `User ${i}`,
      role: "Employee",
      createdAt: "2026-01-01T00:00:00.000Z",
    }));
    stubApi((url) => {
      if (url.startsWith("/users")) {
        const page = Number(new URL(url, "http://x").searchParams.get("page") ?? 1);
        const start = (page - 1) * 10;
        return listResponse(manyUsers.slice(start, start + 10), 12);
      }
      return jsonResponse(404, { error: "nope" });
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("User 0");
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(await screen.findByText("User 11")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("jumps back to the last valid page when the current page becomes empty", async () => {
    const manyUsers = Array.from({ length: 12 }, (_, i) => ({
      id: `u${i}`,
      email: `user${i}@velkor.local`,
      fullName: `User ${i}`,
      role: "Employee",
      createdAt: "2026-01-01T00:00:00.000Z",
    }));
    let total = 12;
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith("/users")) {
        const page = Number(new URL(url, "http://x").searchParams.get("page") ?? 1);
        const start = (page - 1) * 10;
        return jsonResponse(200, {
          items: manyUsers.slice(start, Math.min(start + 10, total)),
          total,
        });
      }
      return jsonResponse(404, { error: "nope" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("User 0");
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await screen.findByText("User 11");
    total = 10;
    await user.click(screen.getByRole("button", { name: "Refresh users" }));
    await vi.waitFor(() =>
      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument(),
    );
    expect(screen.getByText("User 0")).toBeInTheDocument();
    expect(screen.queryByText("No users yet")).not.toBeInTheDocument();
  });
});
