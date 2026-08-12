import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentsTable from "./DocumentsTable";
import { DOCUMENTS } from "@/test/fixtures";

function renderTable(over: Record<string, unknown> = {}) {
  const onSort = vi.fn();
  const onPreview = vi.fn();
  const onDownload = vi.fn();
  render(
    <DocumentsTable
      documents={DOCUMENTS}
      sortBy="displayName"
      order="asc"
      onSort={onSort}
      onPreview={onPreview}
      onDownload={onDownload}
      {...over}
    />,
  );
  return { onSort, onPreview, onDownload };
}

describe("DocumentsTable", () => {
  it("renders document rows with metadata", () => {
    renderTable();
    expect(screen.getByText("Holiday policy")).toBeInTheDocument();
    expect(screen.getByText("holiday-policy.pdf")).toBeInTheDocument();
    expect(screen.getByText("Policies")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("24 KB")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
  });

  it("sorts when a header is clicked", async () => {
    const user = userEvent.setup();
    const { onSort } = renderTable();
    await user.click(screen.getByRole("button", { name: /Sort by Name/ }));
    expect(onSort).toHaveBeenCalledWith("displayName");
  });

  it("shows descending state when active", () => {
    renderTable({ sortBy: "createdAt", order: "desc" });
    expect(
      screen.getByRole("button", { name: /descending/ }),
    ).toBeInTheDocument();
  });

  it("previews and downloads via its action buttons", async () => {
    const user = userEvent.setup();
    const { onPreview, onDownload } = renderTable();
    await user.click(
      screen.getByRole("button", { name: "Preview Holiday policy" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Download Holiday policy" }),
    );
    expect(onPreview).toHaveBeenCalledWith(DOCUMENTS[0]);
    expect(onDownload).toHaveBeenCalledWith(DOCUMENTS[0]);
  });

  it("shows edit and delete buttons when callbacks are provided", () => {
    renderTable({ onEdit: vi.fn(), onDelete: vi.fn() });
    expect(screen.getByRole("button", { name: "Edit Holiday policy" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Holiday policy" }),
    ).toBeInTheDocument();
  });

  it("hides edit and delete buttons without the callbacks", () => {
    renderTable();
    expect(
      screen.queryByRole("button", { name: "Edit Holiday policy" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Holiday policy" }),
    ).not.toBeInTheDocument();
  });
});