import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import CategoriesPage from "./Categories";
import { CATEGORIES, PROFILE, jsonResponse, stubApi } from "@/test/fixtures";
import { useAuth } from "@/context/auth";
import type { UserProfile } from "@/lib/api";

vi.mock("@/context/auth", () => ({
  useAuth: vi.fn(),
}));

function mockUser(claims: string[]) {
  vi.mocked(useAuth).mockReturnValue({
    user: { ...PROFILE, claims } as UserProfile,
  } as never);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CategoriesPage />
    </MemoryRouter>,
  );
}

function listResponse(items: unknown[], total: number) {
  return jsonResponse(200, { items, total });
}

function categoriesStub(url: string) {
  if (url.startsWith("/api/categories")) return listResponse(CATEGORIES, 2);
  return jsonResponse(404, { error: "nope" });
}

describe("CategoriesPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and lists categories", async () => {
    mockUser(["*"]);
    stubApi(categoriesStub);
    renderPage();
    expect(await screen.findByText("Policies")).toBeInTheDocument();
    expect(screen.getByText("1–2 of 2 categories")).toBeInTheDocument();
  });

  it("shows the empty state when there are no categories", async () => {
    mockUser(["*"]);
    stubApi(() => listResponse([], 0));
    renderPage();
    expect(await screen.findByText("No categories yet")).toBeInTheDocument();
  });

  it("shows AccessDenied on a 403", async () => {
    mockUser(["*"]);
    stubApi(() => jsonResponse(403, { error: "Forbidden" }));
    renderPage();
    expect(await screen.findByText("You don't have access")).toBeInTheDocument();
  });

  it("shows an error with a retry button on failure", async () => {
    mockUser(["*"]);
    stubApi(() => jsonResponse(500, { error: "Server error" }));
    renderPage();
    expect(await screen.findByText("Server error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("opens the create dialog from the header button", async () => {
    mockUser(["*"]);
    stubApi(categoriesStub);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /New category/ }));
    expect(
      await screen.findByText("Create a category to organize documents."),
    ).toBeInTheDocument();
  });

  it("hides the new-category button without the manage claim", async () => {
    stubApi(categoriesStub);
    mockUser(["documents:view-categories"]);
    renderPage();
    expect(await screen.findByText("Policies")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /New category/ }),
    ).not.toBeInTheDocument();
  });
});