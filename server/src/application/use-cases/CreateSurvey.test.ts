import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CreateSurvey } from "./CreateSurvey.js";
import { Survey } from "../../domain/entities/Survey.js";
import { InvalidRoleAssignmentError } from "../errors/InvalidRoleAssignmentError.js";
import type { SurveyRepository } from "../ports/SurveyRepository.js";
import type { RoleRepository } from "../ports/RoleRepository.js";

function makeUseCase(overrides?: { countByIds?: number }) {
  const created: unknown[] = [];
  const surveyRepository: SurveyRepository = {
    async list() {
      return { items: [], total: 0 };
    },
    async findById() {
      return null;
    },
    async create(input) {
      created.push(input);
      return new Survey("s1", input.title, input.description, input.type, input.createdById, "Creator", input.assignAllRoles, input.roleIds);
    },
    async close() {},
    async softDelete() {},
    async countResponses() {
      return 0;
    },
    async hasResponded() {
      return false;
    },
    async isAccessible() {
      return true;
    },
    async findPendingForUser() { return []; },
  };
  const roleRepository: RoleRepository = {
    async list() { return { items: [], total: 0 }; },
    async findById() { return null; },
    async findByName() { return null; },
    async create() { throw new Error("not implemented"); },
    async update() { throw new Error("not implemented"); },
    async delete() {},
    async countUsers() { return 0; },
    async countByIds() { return overrides?.countByIds ?? 0; },
    async listUserIdsByRoleIds() { return []; },
  };
  return { useCase: new CreateSurvey(surveyRepository, roleRepository), created };
}

describe("CreateSurvey", () => {
  it("creates a survey with assignAllRoles", async () => {
    const h = makeUseCase();
    const survey = await h.useCase.execute(
      { title: "Q1 Feedback", description: null, type: "NORMAL", roleIds: [], assignAllRoles: true },
      "u1",
    );
    assert.equal(survey.title, "Q1 Feedback");
    assert.equal(survey.type, "NORMAL");
  });

  it("creates a survey with specific roleIds", async () => {
    const h = makeUseCase({ countByIds: 2 });
    const survey = await h.useCase.execute(
      { title: "Team Survey", description: "desc", type: "RATING", roleIds: ["r1", "r2"], assignAllRoles: false },
      "u1",
    );
    assert.equal(survey.title, "Team Survey");
  });

  it("rejects when no roles and assignAllRoles is false", async () => {
    const h = makeUseCase();
    await assert.rejects(
      h.useCase.execute({ title: "Empty", description: null, type: "NORMAL", roleIds: [], assignAllRoles: false }, "u1"),
      InvalidRoleAssignmentError,
    );
  });

  it("rejects when both roleIds and assignAllRoles are set", async () => {
    const h = makeUseCase();
    await assert.rejects(
      h.useCase.execute({ title: "Both", description: null, type: "NORMAL", roleIds: ["r1"], assignAllRoles: true }, "u1"),
      InvalidRoleAssignmentError,
    );
  });

  it("rejects when roleIds contain non-existent roles", async () => {
    const h = makeUseCase({ countByIds: 1 });
    await assert.rejects(
      h.useCase.execute({ title: "Bad", description: null, type: "SATISFACTION", roleIds: ["r1", "r2"], assignAllRoles: false }, "u1"),
      InvalidRoleAssignmentError,
    );
  });
});
