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

describe("RolesPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and lists roles", async () => {
    stubApi((url) => {
      if (url === "/roles") return jsonResponse(200, ROLES);
      if (url === "/claims") return jsonResponse(200, CLAIMS);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    expect(await screen.findByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("2 roles")).toBeInTheDocument();
  });

  it("shows the empty state when there are no roles", async () => {
    stubApi(() => jsonResponse(200, []));
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
    stubApi((url) => {
      if (url === "/roles") return jsonResponse(200, ROLES);
      if (url === "/claims") return jsonResponse(200, CLAIMS);
      return jsonResponse(404, { error: "nope" });
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /New role/ }));
    expect(
      await screen.findByText("Create a role and grant it permissions."),
    ).toBeInTheDocument();
  });

  it("refreshes the list from the refresh button", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/roles") return jsonResponse(200, ROLES);
      if (url === "/claims") return jsonResponse(200, CLAIMS);
      return jsonResponse(404, { error: "nope" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Editor");
    await user.click(screen.getByRole("button", { name: "Refresh roles" }));
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) => url === "/roles"),
      ).toHaveLength(2),
    );
  });
});
