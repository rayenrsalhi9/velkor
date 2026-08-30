import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CloseSurveyDialog from "./CloseSurveyDialog";
import DeleteSurveyDialog from "./DeleteSurveyDialog";
import { jsonResponse, stubApi } from "@/test/fixtures";
import type { Survey } from "@/lib/api";

const SURVEY: Survey = {
  id: "s1",
  title: "Q1 Feedback",
  description: null,
  type: "NORMAL",
  createdByName: "Admin User",
  assignAllRoles: false,
  roleIds: ["r1"],
  closedAt: null,
  createdAt: "2026-01-15T10:00:00.000Z",
};

describe("CloseSurveyDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not render when survey is null", () => {
    render(
      <CloseSurveyDialog survey={null} onOpenChange={vi.fn()} onClosed={vi.fn()} />,
    );
    expect(screen.queryByText("Close survey")).not.toBeInTheDocument();
  });

  it("shows survey title in description", () => {
    render(
      <CloseSurveyDialog survey={SURVEY} onOpenChange={vi.fn()} onClosed={vi.fn()} />,
    );
    expect(screen.getByText("Close survey", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText(/Q1 Feedback/)).toBeInTheDocument();
  });

  it("closes survey and calls onClosed on success", async () => {
    const onClosed = vi.fn();
    const onOpenChange = vi.fn();
    stubApi((url) => {
      if (url.includes("/api/surveys/s1/close")) return jsonResponse(200, {});
      return jsonResponse(404, {});
    });
    const user = userEvent.setup();
    render(
      <CloseSurveyDialog survey={SURVEY} onOpenChange={onOpenChange} onClosed={onClosed} />,
    );
    await user.click(screen.getByRole("button", { name: /Close survey/ }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onClosed).toHaveBeenCalled();
  });

  it("shows error on API failure", async () => {
    stubApi(() => jsonResponse(500, { error: "Cannot close" }));
    const user = userEvent.setup();
    render(
      <CloseSurveyDialog survey={SURVEY} onOpenChange={vi.fn()} onClosed={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: /Close survey/ }));
    await waitFor(() =>
      expect(screen.getByText("Cannot close")).toBeInTheDocument(),
    );
  });

  it("resets error when dialog closes", () => {
    const onOpenChange = vi.fn();
    render(
      <CloseSurveyDialog survey={SURVEY} onOpenChange={onOpenChange} onClosed={vi.fn()} />,
    );
  });
});

describe("DeleteSurveyDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not render when survey is null", () => {
    render(
      <DeleteSurveyDialog survey={null} onOpenChange={vi.fn()} onDeleted={vi.fn()} />,
    );
    expect(screen.queryByText("Delete survey")).not.toBeInTheDocument();
  });

  it("shows survey title in description", () => {
    render(
      <DeleteSurveyDialog survey={SURVEY} onOpenChange={vi.fn()} onDeleted={vi.fn()} />,
    );
    expect(screen.getByText("Delete survey")).toBeInTheDocument();
    expect(screen.getByText(/Q1 Feedback/)).toBeInTheDocument();
  });

  it("deletes survey and calls onDeleted on success", async () => {
    const onDeleted = vi.fn();
    const onOpenChange = vi.fn();
    stubApi((url) => {
      if (url.includes("/api/surveys/s1") && !url.includes("close"))
        return jsonResponse(200, {});
      return jsonResponse(404, {});
    });
    const user = userEvent.setup();
    render(
      <DeleteSurveyDialog survey={SURVEY} onOpenChange={onOpenChange} onDeleted={onDeleted} />,
    );
    await user.click(screen.getByRole("button", { name: /Delete/ }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onDeleted).toHaveBeenCalled();
  });

  it("shows error on API failure", async () => {
    stubApi(() => jsonResponse(500, { error: "Cannot delete" }));
    const user = userEvent.setup();
    render(
      <DeleteSurveyDialog survey={SURVEY} onOpenChange={vi.fn()} onDeleted={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: /Delete/ }));
    await waitFor(() =>
      expect(screen.getByText("Cannot delete")).toBeInTheDocument(),
    );
  });
});
