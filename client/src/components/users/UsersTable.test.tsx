import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersTable from "./UsersTable";
import { USERS } from "@/test/fixtures";

function renderTable() {
  const onSort = vi.fn();
  render(
    <UsersTable
      users={USERS}
      sortBy="fullName"
      order="asc"
      onSort={onSort}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
  return { onSort };
}

describe("UsersTable", () => {
  it("renders each user with name, email, and role", () => {
    renderTable();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("admin@velkor.local")).toBeInTheDocument();
    expect(screen.getByText("Sara Mansour")).toBeInTheDocument();
    expect(screen.getByText("Employee")).toBeInTheDocument();
  });

  it("calls onSort when a column header is clicked", async () => {
    const user = userEvent.setup();
    const { onSort } = renderTable();
    await user.click(screen.getByRole("button", { name: "Sort by Role" }));
    expect(onSort).toHaveBeenCalledWith("role");
  });

  it("calls onEdit with the user", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <UsersTable
        users={USERS}
        sortBy="fullName"
        order="asc"
        onSort={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Edit Admin User" }),
    );
    expect(onEdit).toHaveBeenCalledWith(USERS[0]);
  });

  it("calls onDelete with the user", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <UsersTable
        users={USERS}
        sortBy="fullName"
        order="asc"
        onSort={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Delete Sara Mansour" }),
    );
    expect(onDelete).toHaveBeenCalledWith(USERS[1]);
  });
});
