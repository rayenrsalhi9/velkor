import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SubmitSurveyResponse } from "./SubmitSurveyResponse.js";
import { Survey } from "../../domain/entities/Survey.js";
import { SurveyNotFoundError } from "../errors/SurveyNotFoundError.js";
import { SurveyClosedError } from "../errors/SurveyClosedError.js";
import { SurveyAlreadyAnsweredError } from "../errors/SurveyAlreadyAnsweredError.js";
import type { SurveyRepository } from "../ports/SurveyRepository.js";
import type { SurveyResponseRepository } from "../ports/SurveyResponseRepository.js";

function makeUseCase(opts?: {
  exists?: boolean;
  closed?: boolean;
  accessible?: boolean;
  alreadyAnswered?: boolean;
}) {
  const created: { surveyId: string; userId: string; answer: Record<string, unknown> }[] = [];
  const surveyRepository: SurveyRepository = {
    async findById() {
      if (opts?.exists === false) return null;
      return new Survey("s1", "Q1", null, "NORMAL", "u1", "Admin", false, [], opts?.closed ? new Date() : null);
    },
    async list() { return { items: [], total: 0 }; },
    async create() { throw new Error("not implemented"); },
    async close() {},
    async softDelete() {},
    async countResponses() { return 0; },
    async hasResponded() { return false; },
    async isAccessible() { return opts?.accessible ?? true; },
  };
  const surveyResponseRepository: SurveyResponseRepository = {
    async create(surveyId, userId, answer) {
      created.push({ surveyId, userId, answer });
      return { id: "resp1", surveyId, userId, answer, createdAt: new Date() };
    },
    async existsBySurveyAndUser() { return opts?.alreadyAnswered ?? false; },
    async countBySurvey() { return 0; },
    async getAnalytics() { throw new Error("not implemented"); },
  };
  return { useCase: new SubmitSurveyResponse(surveyRepository, surveyResponseRepository), created };
}

describe("SubmitSurveyResponse", () => {
  it("records a response successfully", async () => {
    const h = makeUseCase();
    await h.useCase.execute("s1", "u2", { value: "yes" }, ["r1"]);
    assert.equal(h.created.length, 1);
    assert.equal(h.created[0]!.userId, "u2");
  });

  it("throws SurveyNotFoundError for unknown survey", async () => {
    const h = makeUseCase({ exists: false });
    await assert.rejects(
      h.useCase.execute("ghost", "u2", { value: "yes" }, ["r1"]),
      SurveyNotFoundError,
    );
  });

  it("throws SurveyClosedError when survey is closed", async () => {
    const h = makeUseCase({ closed: true });
    await assert.rejects(
      h.useCase.execute("s1", "u2", { value: "yes" }, ["r1"]),
      SurveyClosedError,
    );
  });

  it("throws SurveyNotFoundError when user has no access", async () => {
    const h = makeUseCase({ accessible: false });
    await assert.rejects(
      h.useCase.execute("s1", "u2", { value: "yes" }, ["r1"]),
      SurveyNotFoundError,
    );
  });

  it("throws SurveyAlreadyAnsweredError when user already responded", async () => {
    const h = makeUseCase({ alreadyAnswered: true });
    await assert.rejects(
      h.useCase.execute("s1", "u2", { value: "yes" }, ["r1"]),
      SurveyAlreadyAnsweredError,
    );
    assert.equal(h.created.length, 0);
  });
});
