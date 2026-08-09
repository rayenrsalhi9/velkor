import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteRoleDialog from "./DeleteRoleDialog";
import { ROLES, jsonResponse } from "@/test/fixtures";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderDialog(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  const onDeleted = vi.fn();
  render(
    <DeleteRoleDialog
      role={ROLES[1]}
      onOpenChange={onOpenChange}
      onDeleted={onDeleted}
      {...over}
    />,
  );
  return { onOpenChange, onDeleted };
}

describe("DeleteRoleDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("confirms the target role", () => {
    renderDialog();
    expect(screen.getByText("Delete Editor?")).toBeInTheDocument();
  });

  it("deletes the role and closes", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onDeleted } = renderDialog();
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse(200, {})));
    await user.click(screen.getByRole("button", { name: "Delete role" }));
    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      `/roles/${ROLES[1].id}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows an error when deletion fails", async () => {
    const user = userEvent.setup();
    const { onDeleted } = renderDialog();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse(500, { error: "Role is assigned to users" })),
    );
    await user.click(screen.getByRole("button", { name: "Delete role" }));
    expect(
      await screen.findByText("Role is assigned to users"),
    ).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
