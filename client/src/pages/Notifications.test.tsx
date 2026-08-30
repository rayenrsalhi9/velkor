import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Notifications from "./Notifications";
import { jsonResponse, stubApi } from "@/test/fixtures";

const NOTIF = {
  id: "n1",
  userId: "u1",
  type: "document_assigned" as const,
  title: "Document assigned",
  body: 'Document "Holiday policy" assigned to you',
  actorId: "admin",
  refType: "document",
  refId: "d1",
  readAt: null,
  createdAt: "2026-01-01T09:00:00.000Z",
};

const READ_NOTIF = {
  ...NOTIF,
  id: "n2",
  title: "Welcome",
  body: "Your account is ready.",
  readAt: "2026-01-02T00:00:00.000Z",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <Notifications />
    </MemoryRouter>,
  );
}

describe("Notifications page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows empty state when there are no notifications", async () => {
    stubApi(() => jsonResponse(200, { items: [], unread: 0 }));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("No notifications yet")).toBeInTheDocument(),
    );
  });

  it("renders a list of notifications", async () => {
    stubApi(() =>
      jsonResponse(200, { items: [NOTIF, READ_NOTIF], unread: 1 }),
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Document assigned")).toBeInTheDocument(),
    );
    expect(screen.getByText("Welcome")).toBeInTheDocument();
  });

  it("marks all notifications read", async () => {
    const readUrls: string[] = [];
    stubApi((url) => {
      readUrls.push(url);
      if (url === "/api/notifications?limit=50") {
        return jsonResponse(200, { items: [NOTIF], unread: 1 });
      }
      if (url === "/api/notifications/read") {
        return jsonResponse(200, {});
      }
      return jsonResponse(404, {});
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("1 unread notification")).toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Mark all as read" }),
    );
    await waitFor(() =>
      expect(screen.queryByText("1 unread notification")).toBeNull(),
    );
    expect(readUrls).toContain("/api/notifications/read");
  });

  it("shows unread count in the header", async () => {
    stubApi(() =>
      jsonResponse(200, { items: [NOTIF], unread: 1 }),
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("1 unread notification")).toBeInTheDocument(),
    );
  });
});
