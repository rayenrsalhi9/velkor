import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("requests the assigned scope on the assigned page", async () => {
    mockUser(["documents:view-list"]);
    const requestedUrls: string[] = [];
    stubApi((url) => {
      requestedUrls.push(url);
      return listResponse([], 0);
    });
    render(
      <MemoryRouter>
        <DocumentsPage scope="assigned" />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Assigned documents")).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(
        requestedUrls.some((url) => url.includes("scope=assigned")),
      ).toBe(true);
    });
  });

  it("shows edit and delete actions with the matching claims", async () => {
    mockUser(["documents:view-list", "documents:edit", "documents:delete"]);
    stubApi((url) => {
      if (url.startsWith("/api/documents")) return listResponse(DOCUMENTS, 2);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    await screen.findByText("Holiday policy");
    expect(
      screen.getByRole("button", { name: "Edit Holiday policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Holiday policy" }),
    ).toBeInTheDocument();
  });

  it("hides edit and delete actions without the claims", async () => {
    mockUser(["documents:view-list"]);
    stubApi((url) => {
      if (url.startsWith("/api/documents")) return listResponse(DOCUMENTS, 2);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    await screen.findByText("Holiday policy");
    expect(
      screen.queryByRole("button", { name: "Edit Holiday policy" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Holiday policy" }),
    ).not.toBeInTheDocument();
  });

  it("deletes a document after confirmation", async () => {
    mockUser(["documents:view-list", "documents:delete"]);
    const user = userEvent.setup();
    let listCalls = 0;
    stubApi((url, init) => {
      if (url.startsWith("/api/documents") && !init?.method) {
        listCalls += 1;
        return listResponse(DOCUMENTS, 2);
      }
      if (url === "/api/documents/d1" && init?.method === "DELETE") {
        return jsonResponse(200, {});
      }
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Delete Holiday policy" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Delete document" }),
    );
    await vi.waitFor(() => expect(listCalls).toBeGreaterThan(1));
  });

  it("downloads a document from a row action", async () => {
    mockUser(["documents:view-list"]);
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:download");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: revokeObjectURL,
    });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    stubApi((url) => {
      if (url.startsWith("/api/documents/d1/download")) {
        return {
          ok: true,
          status: 200,
          blob: async () => new Blob(["pdf"], { type: "application/pdf" }),
        } as unknown as Response;
      }
      if (url.startsWith("/api/documents")) return listResponse(DOCUMENTS, 2);
      return jsonResponse(404, { error: "nope" });
    });
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Download Holiday policy" }),
    );
    await vi.waitFor(() => expect(anchorClick).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalled();
  });
});