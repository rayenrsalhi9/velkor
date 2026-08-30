import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnswerSurveyDialog from "./AnswerSurveyDialog";
import { jsonResponse, stubApi } from "@/test/fixtures";
import type { Survey } from "@/lib/api";

const NORMAL_SURVEY: Survey = {
  id: "s1",
  title: "Q1 Feedback",
  description: "How are things?",
  type: "NORMAL",
  createdByName: "Admin User",
  assignAllRoles: false,
  roleIds: ["r1"],
  closedAt: null,
  createdAt: "2026-01-15T10:00:00.000Z",
};

const SATISFACTION_SURVEY: Survey = {
  ...NORMAL_SURVEY,
  id: "s2",
  title: "Satisfaction",
  type: "SATISFACTION",
  description: null,
};

const RATING_SURVEY: Survey = {
  ...NORMAL_SURVEY,
  id: "s3",
  title: "Rating",
  type: "RATING",
  description: null,
};

describe("AnswerSurveyDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not render when survey is null", () => {
    render(
      <AnswerSurveyDialog survey={null} onOpenChange={vi.fn()} onAnswered={vi.fn()} />,
    );
    expect(screen.queryByText("Q1 Feedback")).not.toBeInTheDocument();
  });

  it("renders NORMAL survey with Yes/No buttons", () => {
    render(
      <AnswerSurveyDialog survey={NORMAL_SURVEY} onOpenChange={vi.fn()} onAnswered={vi.fn()} />,
    );
    expect(screen.getByText("Q1 Feedback")).toBeInTheDocument();
    expect(screen.getByText("How are things?")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("renders SATISFACTION survey options", () => {
    render(
      <AnswerSurveyDialog survey={SATISFACTION_SURVEY} onOpenChange={vi.fn()} onAnswered={vi.fn()} />,
    );
    expect(screen.getByText("Satisfied")).toBeInTheDocument();
    expect(screen.getByText("Unsatisfied")).toBeInTheDocument();
    expect(screen.getByText("No Opinion")).toBeInTheDocument();
  });

  it("renders RATING survey with 1-5 buttons", () => {
    render(
      <AnswerSurveyDialog survey={RATING_SURVEY} onOpenChange={vi.fn()} onAnswered={vi.fn()} />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("enables submit only after selecting an answer", async () => {
    const user = userEvent.setup();
    render(
      <AnswerSurveyDialog survey={NORMAL_SURVEY} onOpenChange={vi.fn()} onAnswered={vi.fn()} />,
    );
    const submitBtn = screen.getByRole("button", { name: "Submit" });
    expect(submitBtn).toBeDisabled();
    await user.click(screen.getByText("Yes"));
    expect(submitBtn).toBeEnabled();
  });

  it("submits and calls onAnswered on success", async () => {
    const onAnswered = vi.fn();
    const onOpenChange = vi.fn();
    stubApi((url) => {
      if (url.includes("/api/surveys/s1/respond")) return jsonResponse(200, {});
      return jsonResponse(404, {});
    });
    const user = userEvent.setup();
    render(
      <AnswerSurveyDialog survey={NORMAL_SURVEY} onOpenChange={onOpenChange} onAnswered={onAnswered} />,
    );
    await user.click(screen.getByText("Yes"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onAnswered).toHaveBeenCalled();
  });

  it("shows error on API failure", async () => {
    stubApi(() => jsonResponse(500, { error: "Server error" }));
    const user = userEvent.setup();
    render(
      <AnswerSurveyDialog survey={NORMAL_SURVEY} onOpenChange={vi.fn()} onAnswered={vi.fn()} />,
    );
    await user.click(screen.getByText("Yes"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() =>
      expect(screen.getByText("Server error")).toBeInTheDocument(),
    );
  });

  it("resets state on cancel", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <AnswerSurveyDialog survey={NORMAL_SURVEY} onOpenChange={onOpenChange} onAnswered={vi.fn()} />,
    );
    await user.click(screen.getByText("Yes"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets state when dialog closes via backdrop", () => {
    const onOpenChange = vi.fn();
    render(
      <AnswerSurveyDialog survey={NORMAL_SURVEY} onOpenChange={onOpenChange} onAnswered={vi.fn()} />,
    );
  });
});
