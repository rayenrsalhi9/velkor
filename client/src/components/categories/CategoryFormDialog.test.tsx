import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryFormDialog from "./CategoryFormDialog";
import { CATEGORIES, jsonResponse } from "@/test/fixtures";
import type { Category } from "@/lib/api";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

function renderDialog(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  render(
    <CategoryFormDialog
      open
      category={null}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      {...over}
    />,
  );
  return { onOpenChange, onSaved };
}

describe("CategoryFormDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("requires a category name", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Create category" }));
    expect(
      screen.getByText("Enter a name for the category."),
    ).toBeInTheDocument();
  });

  it("submits a new category", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSaved } = renderDialog();
    const submitCalls: { method: string; body: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url === "/api/categories") {
          submitCalls.push({
            method: init?.method ?? "GET",
            body: JSON.parse(String(init?.body)),
          });
        }
        return jsonResponse(200, CATEGORIES[0]);
      }),
    );
    await user.type(screen.getByLabelText("Category name"), "Policies");
    await user.type(screen.getByLabelText("Description"), "Internal policies");
    await user.click(screen.getByRole("button", { name: "Create category" }));
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(submitCalls[0]).toMatchObject({
      method: "POST",
      body: {
        name: "Policies",
        description: "Internal policies",
      },
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith(
      "Category created",
      expect.anything(),
    );
  });

  it("pre-fills an existing category", async () => {
    const category: Category = {
      id: "cat-policies",
      name: "Policies",
      description: "Internal agency policies",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    renderDialog({ category });
    expect(screen.getByLabelText("Category name")).toHaveValue("Policies");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Internal agency policies",
    );
  });
});
