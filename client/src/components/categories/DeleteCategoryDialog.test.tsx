import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteCategoryDialog from "./DeleteCategoryDialog";
import { CATEGORIES, jsonResponse } from "@/test/fixtures";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

function renderDialog(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  const onDeleted = vi.fn();
  render(
    <DeleteCategoryDialog
      category={CATEGORIES[0]}
      onOpenChange={onOpenChange}
      onDeleted={onDeleted}
      {...over}
    />,
  );
  return { onOpenChange, onDeleted };
}

describe("DeleteCategoryDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("deletes the category on confirm", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onDeleted } = renderDialog();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse(200, {})),
    );
    await user.click(
      await screen.findByRole("button", { name: "Delete category" }),
    );
    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith("Category deleted", expect.anything());
  });

  it("is closed when no category is set", () => {
    renderDialog({ category: null });
    expect(
      screen.queryByRole("button", { name: "Delete category" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error when deletion fails", async () => {
    const user = userEvent.setup();
    renderDialog();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse(409, { error: "In use" })),
    );
    await user.click(
      await screen.findByRole("button", { name: "Delete category" }),
    );
    expect(await screen.findByText("In use")).toBeInTheDocument();
  });
});