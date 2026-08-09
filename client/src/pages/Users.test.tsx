import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import UsersPage from "./Users";
import { ROLES, USERS, jsonResponse, stubApi } from "@/test/fixtures";

function renderPage() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>,
  );
}

describe("UsersPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and lists users", async () => {
    stubApi((url) => {
      if (url === "/users") return jsonResponse(200, USERS);
      if (url === "/roles") return jsonResponse(200, ROLES);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    expect(await screen.findByText("Sara Mansour")).toBeInTheDocument();
    expect(screen.getByText("2 users")).toBeInTheDocument();
  });

  it("shows the empty state when there are no users", async () => {
    stubApi(() => jsonResponse(200, []));
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
      if (url === "/users") return jsonResponse(200, USERS);
      if (url === "/roles") return jsonResponse(200, ROLES);
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
      if (url === "/users") return jsonResponse(200, USERS);
      if (url === "/roles") return jsonResponse(200, ROLES);
      return jsonResponse(404, { error: "nope" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Sara Mansour");
    await user.click(screen.getByRole("button", { name: "Refresh users" }));
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) => url === "/users"),
      ).toHaveLength(2),
    );
  });
});
