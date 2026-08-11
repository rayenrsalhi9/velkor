import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import DocumentsPage from "./Documents";
import { DOCUMENTS, PROFILE, jsonResponse, stubApi } from "@/test/fixtures";
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
      <DocumentsPage />
    </MemoryRouter>,
  );
}

function listResponse(items: unknown[], total: number) {
  return jsonResponse(200, { items, total });
}

describe("DocumentsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and lists documents", async () => {
    mockUser(["documents:view-list"]);
    stubApi((url) => {
      if (url.startsWith("/api/documents")) return listResponse(DOCUMENTS, 2);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    expect(await screen.findByText("Holiday policy")).toBeInTheDocument();
    expect(screen.getByText("1–2 of 2 documents")).toBeInTheDocument();
  });

  it("shows the empty state when there are no documents", async () => {
    mockUser(["documents:view-list"]);
    stubApi(() => listResponse([], 0));
    renderPage();
    expect(await screen.findByText("No documents yet")).toBeInTheDocument();
  });

  it("shows AccessDenied on a 403", async () => {
    mockUser(["documents:view-list"]);
    stubApi(() => jsonResponse(403, { error: "Forbidden" }));
    renderPage();
    expect(await screen.findByText("You don't have access")).toBeInTheDocument();
  });

  it("shows an error with a retry button on failure", async () => {
    mockUser(["documents:view-list"]);
    stubApi(() => jsonResponse(500, { error: "Server error" }));
    renderPage();
    expect(await screen.findByText("Server error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the upload button with the upload claim", async () => {
    mockUser(["documents:view-list", "documents:upload"]);
    stubApi((url) => {
      if (url.startsWith("/api/documents")) return listResponse(DOCUMENTS, 2);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    expect(
      await screen.findByRole("button", { name: /Upload document/ }),
    ).toBeInTheDocument();
  });

  it("hides the upload button without the upload claim", async () => {
    mockUser(["documents:view-list"]);
    stubApi((url) => {
      if (url.startsWith("/api/documents")) return listResponse(DOCUMENTS, 2);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    expect(await screen.findByText("Holiday policy")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Upload document/ }),
    ).not.toBeInTheDocument();
  });
});