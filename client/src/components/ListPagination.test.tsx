import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListPagination from "./ListPagination";

function renderPagination(over: Partial<Parameters<typeof ListPagination>[0]> = {}) {
  const onPageChange = vi.fn();
  render(
    <ListPagination
      page={1}
      pageSize={10}
      total={25}
      label="users"
      onPageChange={onPageChange}
      {...over}
    />,
  );
  return onPageChange;
}

describe("ListPagination", () => {
  it("shows the item range and page count", () => {
    renderPagination();
    expect(screen.getByText("1–10 of 25 users")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("shows a single 0 range when there are no items", () => {
    renderPagination({ total: 0 });
    expect(screen.getByText("0 users")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });

  it("disables Previous on the first page", () => {
    renderPagination({ page: 1 });
    expect(screen.getByRole("button", { name: /Previous/ })).toBeDisabled();
  });

  it("disables Next on the last page", () => {
    renderPagination({ page: 3 });
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
  });

  it("goes to the next page", async () => {
    const user = userEvent.setup();
    const onPageChange = renderPagination();
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("goes to the previous page", async () => {
    const user = userEvent.setup();
    const onPageChange = renderPagination({ page: 2 });
    await user.click(screen.getByRole("button", { name: /Previous/ }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
