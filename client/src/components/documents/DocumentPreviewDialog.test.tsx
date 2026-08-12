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

const originalDescriptors = new Map<string, PropertyDescriptor | undefined>();

function stubObjectUrls() {
  const createObjectURL = vi.fn(() => "blob:preview");
  const revokeObjectURL = vi.fn();
  for (const [key, value] of Object.entries({ createObjectURL, revokeObjectURL })) {
    originalDescriptors.set(key, Object.getOwnPropertyDescriptor(URL, key));
    Object.defineProperty(URL, key, { configurable: true, value });
  }
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
    for (const [key, descriptor] of originalDescriptors) {
      if (descriptor) Object.defineProperty(URL, key, descriptor);
      else delete (URL as unknown as Record<string, unknown>)[key];
    }
    originalDescriptors.clear();
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

  it("ignores a stale text preview after the document changes", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let blockFirst = true;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const id = url.split("/").filter(Boolean)[2];
        return {
          ok: true,
          status: 200,
          blob: async () => {
            if (id === "d1" && blockFirst) await gate;
            return { text: async () => (id === "d1" ? "STALE" : "FRESH") };
          },
        };
      }),
    );
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DocumentPreviewDialog document={DOCUMENTS[0]} onOpenChange={onOpenChange} />,
    );
    rerender(
      <DocumentPreviewDialog
        document={{
          ...DOCUMENTS[0],
          id: "d2",
          displayName: "Monthly report",
          fileName: "monthly.txt",
          mimeType: "text/plain",
        }}
        onOpenChange={onOpenChange}
      />,
    );
    expect(await screen.findByText(/FRESH/)).toBeInTheDocument();
    blockFirst = false;
    release();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/STALE/)).not.toBeInTheDocument();
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