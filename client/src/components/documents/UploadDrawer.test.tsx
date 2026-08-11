import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadDrawer from "./UploadDrawer";
import { CATEGORIES, ROLES, jsonResponse } from "@/test/fixtures";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

function renderDrawer(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  render(
    <UploadDrawer
      open
      onOpenChange={onOpenChange}
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

describe("UploadDrawer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("requires a file, category, and roles", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(screen.getByRole("button", { name: "Upload document" }));
    expect(
      screen.getByText("Choose a file to upload."),
    ).toBeInTheDocument();
  });

  it("posts multipart form data and closes on success", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSaved } = renderDrawer();
    stubFetch({
      "/api/categories": jsonResponse(200, { items: CATEGORIES, total: 2 }),
      "/api/roles": jsonResponse(200, { items: ROLES, total: 2 }),
      "/api/documents": jsonResponse(201, { id: "d1" }),
    });
    await user.upload(
      screen.getByLabelText("Choose file"),
      new File(["abc"], "report.pdf", { type: "application/pdf" }),
    );
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Select category"), "Policies");
    await user.click(await screen.findByText("Policies"));
    await user.click(screen.getByRole("checkbox", { name: /Assign to all roles/ }));
    await user.click(screen.getByRole("button", { name: "Upload document" }));
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith(
      "Document uploaded",
      expect.anything(),
    );
    const uploadCall = vi.mocked(fetch).mock.calls.find(
      ([url]) => url === "/api/documents",
    );
    const body = uploadCall?.[1]?.body as FormData;
    expect(body.get("categoryId")).toBe("cat-policies");
    expect(body.get("assignAllRoles")).toBe("true");
    expect(body.get("file")).toBeInstanceOf(File);
    const headers = uploadCall?.[1]?.headers as Headers | undefined;
    expect(headers?.get("Content-Type")).toBeNull();
  });

  it("shows a server error when upload fails", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderDrawer();
    stubFetch({
      "/api/categories": jsonResponse(200, { items: CATEGORIES, total: 2 }),
      "/api/documents": jsonResponse(400, { error: "File type is not supported" }),
    });
    await user.upload(
      screen.getByLabelText("Choose file"),
      new File(["abc"], "evil.exe", { type: "application/x-msdownload" }),
    );
    await user.type(screen.getByLabelText("Select category"), "Policies");
    await user.click(await screen.findByText("Policies"));
    await user.click(screen.getByRole("checkbox", { name: /Assign to all roles/ }));
    await user.click(screen.getByRole("button", { name: "Upload document" }));
    expect(
      await screen.findByText("File type is not supported"),
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});