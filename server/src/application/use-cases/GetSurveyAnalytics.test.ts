import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GetSurveyAnalytics } from "./GetSurveyAnalytics.js";
import { Survey } from "../../domain/entities/Survey.js";
import { SurveyNotFoundError } from "../errors/SurveyNotFoundError.js";
import type { SurveyRepository } from "../ports/SurveyRepository.js";
import type { SurveyResponseRepository, SurveyAnalytics } from "../ports/SurveyResponseRepository.js";

const fakeAnalytics: SurveyAnalytics = {
  surveyId: "s1",
  title: "Q1",
  type: "NORMAL",
  totalResponses: 5,
  breakdown: [
    { option: "yes", count: 3 },
    { option: "no", count: 2 },
  ],
};

function makeUseCase(opts?: { exists?: boolean }) {
  const surveyRepository: SurveyRepository = {
    async findById() {
      return opts?.exists === false
        ? null
        : new Survey("s1", "Q1", null, "NORMAL", "u1", "Admin");
    },
    async list() { return { items: [], total: 0 }; },
    async create() { throw new Error("not implemented"); },
    async close() {},
    async softDelete() {},
    async countResponses() { return 0; },
    async hasResponded() { return false; },
    async isAccessible() { return true; },
    async findPendingForUser() { return []; },
  };
  const surveyResponseRepository: SurveyResponseRepository = {
    async create() { throw new Error("not implemented"); },
    async existsBySurveyAndUser() { return false; },
    async countBySurvey() { return 0; },
    async getAnalytics() { return fakeAnalytics; },
  };
  return new GetSurveyAnalytics(surveyRepository, surveyResponseRepository);
}

describe("GetSurveyAnalytics", () => {
  it("returns analytics for an existing survey", async () => {
    const useCase = makeUseCase();
    const analytics = await useCase.execute("s1");
    assert.equal(analytics.totalResponses, 5);
    assert.equal(analytics.breakdown.length, 2);
  });

  it("throws SurveyNotFoundError for unknown survey", async () => {
    const useCase = makeUseCase({ exists: false });
    await assert.rejects(useCase.execute("ghost"), SurveyNotFoundError);
  });
});
