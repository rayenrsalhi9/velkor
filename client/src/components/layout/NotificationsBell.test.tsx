import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import NotificationsBell from "./NotificationsBell";
import { jsonResponse, stubApi } from "@/test/fixtures";

describe("NotificationsBell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows no badge when there are no unread notifications", async () => {
    stubApi(() => jsonResponse(200, { items: [], unread: 0 }));
    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>,
    );
    const link = await screen.findByRole("link", { name: "Notifications" });
    expect(link.textContent).toBe("");
  });

  it("shows a badge with the unread count", async () => {
    stubApi(() => jsonResponse(200, { items: [], unread: 3 }));
    render(
      <MemoryRouter>
        <NotificationsBell />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "Notifications (3 unread)" }),
      ).not.toBeNull(),
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
