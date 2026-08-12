import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditDocumentDialog from "./EditDocumentDialog";
import { CATEGORIES, DOCUMENTS, ROLES, jsonResponse } from "@/test/fixtures";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

function renderDialog(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  render(
    <EditDocumentDialog
      open
      onOpenChange={onOpenChange}
      document={DOCUMENTS[0]}
      onSaved={onSaved}
      {...over}
    />,
  );
  return { onOpenChange, onSaved };
}

function stubFetch(overrides: Record<string, Response> = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      for (const [prefix, response] of Object.entries(overrides)) {
        if (url.startsWith(prefix)) return response;
      }
      return jsonResponse(404, { error: "not found" });
    }),
  );
}

describe("EditDocumentDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("prefills the current document and saves edits", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSaved } = renderDialog();
    stubFetch({
      "/api/categories": jsonResponse(200, { items: CATEGORIES, total: 2 }),
      "/api/roles": jsonResponse(200, { items: ROLES, total: 2 }),
      "/api/documents/d1": jsonResponse(200, DOCUMENTS[0]),
    });

    const input = await screen.findByDisplayValue("Holiday policy");
    expect(screen.getByLabelText("Select category")).toHaveValue("Policies");
    await user.clear(input);
    await user.type(input, "Holiday policy v2");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith(
      "Document updated",
      expect.anything(),
    );
    const patchCall = vi.mocked(fetch).mock.calls.find(
      ([url, init]) => url === "/api/documents/d1" && init?.method === "PATCH",
    );
    const body = JSON.parse(String(patchCall?.[1]?.body)) as {
      displayName: string;
      assignAllRoles: boolean;
      roleIds: string[];
    };
    expect(body.displayName).toBe("Holiday policy v2");
    expect(body.assignAllRoles).toBe(false);
    expect(body.roleIds).toEqual(["role-admin"]);
  });

  it("saves an all-roles assignment with no roleIds", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSaved } = renderDialog();
    stubFetch({
      "/api/categories": jsonResponse(200, { items: CATEGORIES, total: 2 }),
      "/api/roles": jsonResponse(200, { items: ROLES, total: 2 }),
      "/api/documents/d1": jsonResponse(200, DOCUMENTS[0]),
    });

    await screen.findByDisplayValue("Holiday policy");
    await user.click(
      screen.getByRole("checkbox", { name: /Assign to all roles/ }),
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    const patchCall = vi.mocked(fetch).mock.calls.find(
      ([url, init]) => url === "/api/documents/d1" && init?.method === "PATCH",
    );
    const body = JSON.parse(String(patchCall?.[1]?.body)) as {
      assignAllRoles: boolean;
      roleIds: string[];
    };
    expect(body.assignAllRoles).toBe(true);
    expect(body.roleIds).toEqual([]);
  });

  it("shows a server error when saving fails", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderDialog();
    stubFetch({
      "/api/categories": jsonResponse(200, { items: CATEGORIES, total: 2 }),
      "/api/roles": jsonResponse(200, { items: ROLES, total: 2 }),
      "/api/documents/d1": jsonResponse(400, { error: "Invalid category" }),
    });

    await screen.findByDisplayValue("Holiday policy");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Invalid category")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});