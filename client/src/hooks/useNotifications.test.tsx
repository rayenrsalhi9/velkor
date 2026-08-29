import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useNotifications } from "./useNotifications";
import { jsonResponse, stubApi } from "@/test/fixtures";

const NOTIF = {
  id: "n1",
  userId: "u1",
  type: "document_assigned",
  title: "Document assigned",
  body: 'Document "Holiday policy" assigned to you',
  actorId: "admin",
  refType: "document",
  refId: "d1",
  readAt: null,
  createdAt: "2026-01-01T09:00:00.000Z",
};

function Harness() {
  const r = useNotifications();
  return (
    <div>
      <span data-testid="unread">{r.unread}</span>
      <span data-testid="count">{r.items.length}</span>
      <button onClick={() => void r.read([NOTIF.id])}>mark read</button>
    </div>
  );
}

describe("useNotifications", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads notifications and unread count", async () => {
    stubApi((url) => {
      if (url === "/api/notifications?limit=50") {
        return jsonResponse(200, { items: [NOTIF], unread: 1 });
      }
      return jsonResponse(404, {});
    });
    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("unread").textContent).toBe("1"));
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("marks a notification read", async () => {
    const reqs: string[] = [];
    stubApi((url) => {
      reqs.push(url);
      if (url === "/api/notifications?limit=50") {
        return jsonResponse(200, { items: [NOTIF], unread: 1 });
      }
      if (url === "/api/notifications/read") {
        return jsonResponse(200, {});
      }
      return jsonResponse(404, {});
    });

    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("unread").textContent).toBe("1"));

    fireEvent.click(screen.getByRole("button", { name: "mark read" }));
    await waitFor(() => expect(screen.getByTestId("unread").textContent).toBe("0"));
    expect(reqs).toContain("/api/notifications/read");
  });

  it("ignores errors during polling without crashing", async () => {
    stubApi(() => jsonResponse(500, {}));
    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("0"));
  });
});
