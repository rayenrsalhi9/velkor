import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CloseSurvey } from "./CloseSurvey.js";
import { Survey } from "../../domain/entities/Survey.js";
import { SurveyNotFoundError } from "../errors/SurveyNotFoundError.js";
import { NotSurveyCreatorError } from "../errors/NotSurveyCreatorError.js";
import type { SurveyRepository } from "../ports/SurveyRepository.js";

function makeUseCase(opts?: { exists?: boolean; creatorId?: string }) {
  const closedIds: string[] = [];
  const surveyRepository: SurveyRepository = {
    async findById() {
      if (opts?.exists === false) return null;
      return new Survey("s1", "Q1", null, "NORMAL", opts?.creatorId ?? "u1", "Admin");
    },
    async list() { return { items: [], total: 0 }; },
    async create() { throw new Error("not implemented"); },
    async close(id) { closedIds.push(id); },
    async softDelete() {},
    async countResponses() { return 0; },
    async hasResponded() { return false; },
    async isAccessible() { return true; },
  };
  return { useCase: new CloseSurvey(surveyRepository), closedIds };
}

describe("CloseSurvey", () => {
  it("closes a survey as creator", async () => {
    const h = makeUseCase();
    await h.useCase.execute("s1", "u1", false);
    assert.deepEqual(h.closedIds, ["s1"]);
  });

  it("closes a survey as admin (non-creator)", async () => {
    const h = makeUseCase({ creatorId: "u2" });
    await h.useCase.execute("s1", "u1", true);
    assert.deepEqual(h.closedIds, ["s1"]);
  });

  it("throws SurveyNotFoundError for unknown survey", async () => {
    const h = makeUseCase({ exists: false });
    await assert.rejects(h.useCase.execute("ghost", "u1", false), SurveyNotFoundError);
  });

  it("throws NotSurveyCreatorError when non-creator non-admin tries to close", async () => {
    const h = makeUseCase({ creatorId: "u1" });
    await assert.rejects(h.useCase.execute("s1", "u2", false), NotSurveyCreatorError);
    assert.equal(h.closedIds.length, 0);
  });
});
