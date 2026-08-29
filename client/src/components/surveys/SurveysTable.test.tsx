import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SurveysTable from "./SurveysTable";
import type { Survey } from "@/lib/api";

const SURVEYS: Survey[] = [
  {
    id: "s1",
    title: "Q1 Feedback",
    description: null,
    type: "NORMAL",
    createdByName: "Admin User",
    assignAllRoles: false,
    roleIds: ["r1"],
    closedAt: null,
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "s2",
    title: "Satisfaction Check",
    description: "How are things?",
    type: "SATISFACTION",
    createdByName: "Sara Mansour",
    assignAllRoles: true,
    roleIds: [],
    closedAt: "2026-02-01T10:00:00.000Z",
    createdAt: "2026-01-20T10:00:00.000Z",
  },
];

function renderTable(over: Record<string, unknown> = {}) {
  const onSort = vi.fn();
  const onAnalytics = vi.fn();
  const onClose = vi.fn();
  const onDelete = vi.fn();
  render(
    <SurveysTable
      surveys={SURVEYS}
      sortBy="createdAt"
      order="desc"
      onSort={onSort}
      onAnalytics={onAnalytics}
      onClose={onClose}
      onDelete={onDelete}
      {...over}
    />,
  );
  return { onSort, onAnalytics, onClose, onDelete };
}

describe("SurveysTable", () => {
  it("renders survey rows with title, type, and status", () => {
    renderTable();
    expect(screen.getByText("Q1 Feedback")).toBeInTheDocument();
    expect(screen.getByText("Satisfaction Check")).toBeInTheDocument();
    expect(screen.getByText("Yes / No")).toBeInTheDocument();
    expect(screen.getByText("Satisfaction")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("sorts when a header is clicked", async () => {
    const user = userEvent.setup();
    const { onSort } = renderTable();
    await user.click(screen.getByRole("button", { name: /Sort by Title/ }));
    expect(onSort).toHaveBeenCalledWith("title");
  });

  it("shows descending state when active", () => {
    renderTable({ sortBy: "createdAt", order: "desc" });
    expect(
      screen.getByRole("button", { name: /descending/ }),
    ).toBeInTheDocument();
  });

  it("invokes analytics handler from row action", async () => {
    const user = userEvent.setup();
    const { onAnalytics } = renderTable();
    await user.click(screen.getByLabelText("View analytics for Q1 Feedback"));
    expect(onAnalytics).toHaveBeenCalledWith(SURVEYS[0]);
  });

  it("invokes delete handler from row action", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderTable();
    await user.click(screen.getByLabelText("Delete Q1 Feedback"));
    expect(onDelete).toHaveBeenCalledWith(SURVEYS[0]);
  });

  it("shows close button only for open surveys", () => {
    renderTable();
    expect(screen.getByLabelText("Close Q1 Feedback")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Close Satisfaction Check"),
    ).not.toBeInTheDocument();
  });
});
