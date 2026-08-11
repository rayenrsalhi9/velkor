import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoriesTable from "./CategoriesTable";
import { CATEGORIES } from "@/test/fixtures";

function renderTable(over: Record<string, unknown> = {}) {
  const onSort = vi.fn();
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <CategoriesTable
      categories={CATEGORIES}
      sortBy="name"
      order="asc"
      onSort={onSort}
      onEdit={onEdit}
      onDelete={onDelete}
      {...over}
    />,
  );
  return { onSort, onEdit, onDelete };
}

describe("CategoriesTable", () => {
  it("renders category rows with name and description", () => {
    renderTable();
    expect(screen.getByText("Policies")).toBeInTheDocument();
    expect(screen.getByText("Internal agency policies")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("sorts when a header is clicked", async () => {
    const user = userEvent.setup();
    const { onSort } = renderTable();
    await user.click(screen.getByRole("button", { name: /Sort by Category/ }));
    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("shows descending state when active", () => {
    renderTable({ sortBy: "name", order: "desc" });
    expect(
      screen.getByRole("button", { name: /descending/ }),
    ).toBeInTheDocument();
  });

  it("invokes edit and delete handlers from row actions", async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = renderTable();
    await user.click(screen.getByLabelText("Edit Policies"));
    await user.click(screen.getByLabelText("Delete Reports"));
    expect(onEdit).toHaveBeenCalledWith(CATEGORIES[0]);
    expect(onDelete).toHaveBeenCalledWith(CATEGORIES[1]);
  });
});
