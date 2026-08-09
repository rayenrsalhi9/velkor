import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteUserDialog from "./DeleteUserDialog";
import { USERS, jsonResponse } from "@/test/fixtures";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderDialog(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  const onDeleted = vi.fn();
  render(
    <DeleteUserDialog
      user={USERS[0]}
      onOpenChange={onOpenChange}
      onDeleted={onDeleted}
      {...over}
    />,
  );
  return { onOpenChange, onDeleted };
}

describe("DeleteUserDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("confirms the target user", () => {
    renderDialog();
    expect(screen.getByText("Delete Admin User?")).toBeInTheDocument();
  });

  it("deletes the user and closes", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onDeleted } = renderDialog();
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse(200, {})));
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      `/users/${USERS[0].id}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows an error when deletion fails", async () => {
    const user = userEvent.setup();
    const { onDeleted } = renderDialog();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse(500, { error: "Cannot delete this user" })),
    );
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    expect(
      await screen.findByText("Cannot delete this user"),
    ).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
