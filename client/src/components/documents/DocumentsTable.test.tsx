import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentsTable from "./DocumentsTable";
import { DOCUMENTS } from "@/test/fixtures";

function renderTable(over: Record<string, unknown> = {}) {
  const onSort = vi.fn();
  render(
    <DocumentsTable
      documents={DOCUMENTS}
      sortBy="displayName"
      order="asc"
      onSort={onSort}
      {...over}
    />,
  );
  return { onSort };
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
});