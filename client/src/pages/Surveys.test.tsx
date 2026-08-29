import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import SurveysPage from "./Surveys";
import { jsonResponse, stubApi } from "@/test/fixtures";
import { useAuth } from "@/context/auth";
import type { UserProfile } from "@/lib/api";

vi.mock("@/context/auth", () => ({
  useAuth: vi.fn(),
}));

function mockUser(claims: string[]) {
  vi.mocked(useAuth).mockReturnValue({
    user: { claims } as UserProfile,
  } as never);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SurveysPage />
    </MemoryRouter>,
  );
}

const SURVEYS = [
  {
    id: "s1",
    title: "Q1 Feedback",
    description: null,
    type: "NORMAL",
    createdById: "u1",
    createdByName: "Admin User",
    assignAllRoles: false,
    roleIds: ["r1"],
    closedAt: null,
    createdAt: "2026-01-15T10:00:00.000Z",
  },
];

function listResponse(items: unknown[], total: number) {
  return jsonResponse(200, { items, total });
}

describe("SurveysPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and lists surveys", async () => {
    mockUser(["surveys:view"]);
    stubApi((url) => {
      if (url.startsWith("/api/surveys")) return listResponse(SURVEYS, 1);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    expect(await screen.findByText("Q1 Feedback")).toBeInTheDocument();
    expect(screen.getByText("1–1 of 1 surveys")).toBeInTheDocument();
  });

  it("shows the empty state when there are no surveys", async () => {
    mockUser(["surveys:view"]);
    stubApi(() => listResponse([], 0));
    renderPage();
    expect(await screen.findByText("No surveys yet")).toBeInTheDocument();
  });

  it("shows AccessDenied on a 403", async () => {
    mockUser(["surveys:view"]);
    stubApi(() => jsonResponse(403, { error: "Forbidden" }));
    renderPage();
    expect(await screen.findByText("You don't have access")).toBeInTheDocument();
  });

  it("shows an error with retry button on failure", async () => {
    mockUser(["surveys:view"]);
    stubApi(() => jsonResponse(500, { error: "Server error" }));
    renderPage();
    expect(await screen.findByText("Server error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the create button with the create claim", async () => {
    mockUser(["surveys:view", "surveys:create"]);
    stubApi((url) => {
      if (url.startsWith("/api/surveys")) return listResponse(SURVEYS, 1);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    expect(
      await screen.findByRole("button", { name: /New survey/ }),
    ).toBeInTheDocument();
  });

  it("hides the create button without the create claim", async () => {
    mockUser(["surveys:view"]);
    stubApi((url) => {
      if (url.startsWith("/api/surveys")) return listResponse(SURVEYS, 1);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    expect(await screen.findByText("Q1 Feedback")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /New survey/ }),
    ).not.toBeInTheDocument();
  });
});
