import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListSurveys } from "./ListSurveys.js";
import { Survey } from "../../domain/entities/Survey.js";
import type { SurveyRepository } from "../ports/SurveyRepository.js";

function makeUseCase(items?: Survey[]) {
  const surveyRepository: SurveyRepository = {
    async list() {
      return { items: items ?? [], total: items?.length ?? 0 };
    },
    async findById() { return null; },
    async create() { throw new Error("not implemented"); },
    async close() {},
    async softDelete() {},
    async countResponses() { return 0; },
    async hasResponded() { return false; },
    async isAccessible() { return true; },
    async findPendingForUser() { return []; },
  };
  return new ListSurveys(surveyRepository);
}

describe("ListSurveys", () => {
  it("returns paginated surveys", async () => {
    const s = new Survey("s1", "Q1", null, "NORMAL", "u1", "Admin");
    const listSurveys = makeUseCase([s]);
    const result = await listSurveys.execute({ q: undefined, sortBy: "createdAt", order: "desc", page: 1, pageSize: 10 });
    assert.equal(result.total, 1);
    assert.equal(result.items[0]!.title, "Q1");
  });

  it("returns empty list", async () => {
    const listSurveys = makeUseCase();
    const result = await listSurveys.execute({ q: undefined, sortBy: "title", order: "asc", page: 1, pageSize: 10 });
    assert.equal(result.total, 0);
    assert.deepEqual(result.items, []);
  });
});
