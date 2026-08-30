import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SurveyAnalyticsDialog from "./SurveyAnalyticsDialog";
import { jsonResponse, stubApi } from "@/test/fixtures";
import type { Survey, SurveyAnalytics } from "@/lib/api";

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

const RATING_SURVEY: Survey = {
  ...SURVEY,
  id: "s2",
  title: "Rating Survey",
  type: "RATING",
};

const ANALYTICS: SurveyAnalytics = {
  surveyId: "s1",
  title: "Q1 Feedback",
  type: "NORMAL",
  totalResponses: 10,
  breakdown: [
    { option: "yes", count: 7 },
    { option: "no", count: 3 },
  ],
};

const RATING_ANALYTICS: SurveyAnalytics = {
  surveyId: "s2",
  title: "Rating Survey",
  type: "RATING",
  totalResponses: 5,
  breakdown: [
    { option: "1", count: 1 },
    { option: "3", count: 2 },
    { option: "5", count: 2 },
  ],
  averageRating: 3.6,
};

const EMPTY_ANALYTICS: SurveyAnalytics = {
  surveyId: "s1",
  title: "Q1 Feedback",
  type: "NORMAL",
  totalResponses: 0,
  breakdown: [],
};

describe("SurveyAnalyticsDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("displays analytics data after loading", async () => {
    stubApi((url) => {
      if (url.includes("/api/surveys/s1/analytics")) {
        return jsonResponse(200, ANALYTICS);
      }
      return jsonResponse(404, {});
    });
    render(
      <SurveyAnalyticsDialog survey={SURVEY} onOpenChange={vi.fn()} />,
    );
    await waitFor(() =>
      expect(screen.getByText("10")).toBeInTheDocument(),
    );
    expect(screen.getByText("responses")).toBeInTheDocument();
    expect(screen.getByText("yes")).toBeInTheDocument();
    expect(screen.getByText("no")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows average rating for RATING surveys", async () => {
    stubApi((url) => {
      if (url.includes("/api/surveys/s2/analytics")) {
        return jsonResponse(200, RATING_ANALYTICS);
      }
      return jsonResponse(404, {});
    });
    render(
      <SurveyAnalyticsDialog survey={RATING_SURVEY} onOpenChange={vi.fn()} />,
    );
    await waitFor(() =>
      expect(screen.getByText(/Avg:/)).toBeInTheDocument(),
    );
    expect(screen.getByText("3.6")).toBeInTheDocument();
  });

  it("shows 'No responses yet' for empty breakdown", async () => {
    stubApi((url) => {
      if (url.includes("/api/surveys/s1/analytics")) {
        return jsonResponse(200, EMPTY_ANALYTICS);
      }
      return jsonResponse(404, {});
    });
    render(
      <SurveyAnalyticsDialog survey={SURVEY} onOpenChange={vi.fn()} />,
    );
    await waitFor(() =>
      expect(screen.getByText("No responses yet.")).toBeInTheDocument(),
    );
  });

  it("displays an error when the API fails", async () => {
    stubApi(() => jsonResponse(500, { error: "Server error" }));
    render(
      <SurveyAnalyticsDialog survey={SURVEY} onOpenChange={vi.fn()} />,
    );
    await waitFor(() =>
      expect(screen.getByText("Server error")).toBeInTheDocument(),
    );
  });

  it("does not fetch when survey is null", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(
      <SurveyAnalyticsDialog survey={null} onOpenChange={vi.fn()} />,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
