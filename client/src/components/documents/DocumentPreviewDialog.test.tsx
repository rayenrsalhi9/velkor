import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentPreviewDialog from "./DocumentPreviewDialog";
import { DOCUMENTS, jsonResponse } from "@/test/fixtures";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function blobResponse(mimeType: string, content: string) {
  return {
    ok: true,
    status: 200,
    blob: async () => new Blob([content], { type: mimeType }),
  };
}

function stubObjectUrls() {
  const createObjectURL = vi.fn(() => "blob:preview");
  const revokeObjectURL = vi.fn();
  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: revokeObjectURL,
  });
  return { createObjectURL, revokeObjectURL };
}

function renderDialog(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  render(
    <DocumentPreviewDialog
      document={DOCUMENTS[0]}
      onOpenChange={onOpenChange}
      {...over}
    />,
  );
  return { onOpenChange };
}

describe("DocumentPreviewDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders PDFs in an iframe", async () => {
    stubObjectUrls();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => blobResponse("application/pdf", "pdf-bytes")),
    );
    renderDialog();
    const iframe = await screen.findByTitle("Holiday policy");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "blob:preview");
  });

  it("renders images", async () => {
    stubObjectUrls();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => blobResponse("image/png", "png-bytes")),
    );
    renderDialog({ document: { ...DOCUMENTS[0], mimeType: "image/png" } });
    const image = await screen.findByAltText("Holiday policy");
    expect(image).toHaveAttribute("src", "blob:preview");
  });

  it("renders text and CSV content as plain text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => blobResponse("text/csv", "a,b,c\n1,2,3")),
    );
    renderDialog({ document: { ...DOCUMENTS[0], mimeType: "text/csv" } });
    expect(await screen.findByText(/1,2,3/)).toBeInTheDocument();
  });

  it("shows a fallback for unsupported file types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => blobResponse("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx")),
    );
    renderDialog({ document: { ...DOCUMENTS[0], mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } });
    expect(
      await screen.findByText("Preview unavailable"),
    ).toBeInTheDocument();
  });

  it("downloads the fetched file from the dialog", async () => {
    const { createObjectURL } = stubObjectUrls();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => blobResponse("application/pdf", "pdf-bytes")),
    );
    const anchorClick = vi.spyOn(
      HTMLAnchorElement.prototype,
      "click",
    ).mockImplementation(() => {});
    renderDialog();
    await userEvent.click(
      await screen.findByRole("button", { name: "Download" }),
    );
    expect(anchorClick).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
  });

  it("shows an error when the file cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse(500, { error: "Fetch failed" })),
    );
    renderDialog();
    expect(await screen.findByText("Fetch failed")).toBeInTheDocument();
  });
});