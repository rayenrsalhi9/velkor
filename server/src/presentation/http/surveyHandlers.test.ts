import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import {
  makeCreateSurveyHandler,
  makeListSurveysHandler,
  makeGetSurveyAnalyticsHandler,
  makeSubmitSurveyResponseHandler,
  makeCloseSurveyHandler,
  makeDeleteSurveyHandler,
} from "./surveyHandlers.js";
import { Survey } from "../../domain/entities/Survey.js";
import { Role } from "../../domain/entities/Role.js";
import { SurveyNotFoundError } from "../../application/errors/SurveyNotFoundError.js";
import { SurveyClosedError } from "../../application/errors/SurveyClosedError.js";
import { SurveyAlreadyAnsweredError } from "../../application/errors/SurveyAlreadyAnsweredError.js";
import { NotSurveyCreatorError } from "../../application/errors/NotSurveyCreatorError.js";
import { InvalidRoleAssignmentError } from "../../application/errors/InvalidRoleAssignmentError.js";

import type { RoleRepository } from "../../application/ports/RoleRepository.js";

type FakeRes = {
  statusCode: number;
  body: unknown;
  status(code: number): FakeRes;
  json(body: unknown): FakeRes;
  send(body?: unknown): FakeRes;
};

function makeRes(): FakeRes & Response {
  const res: FakeRes = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    send(body) {
      if (body !== undefined) this.body = body;
      return this;
    },
  };
  return res as unknown as FakeRes & Response;
}

function makeReq(over: Partial<Request> = {}): Request {
  return {
    params: {},
    query: {},
    body: {},
    currentUser: {
      userId: "u1",
      email: "a@b.c",
      fullName: "Ada",
      role: "employee",
      claims: [],
    },
    ...over,
  } as Request;
}

const SURVEY_ID = "c0a5e1a1-0000-4000-8000-000000000001";
const GHOST_ID = "c0a5e1a1-0000-4000-8000-000000000099";

const survey = new Survey(SURVEY_ID, "Q1", null, "NORMAL", "u1", "Admin");

const asExecute = (fn: unknown) => ({ execute: fn }) as never;

function makeRoleRepo(findResult: { id: string; name: string } | null = null): RoleRepository {
  return {
    async list() { return { items: [], total: 0 }; },
    async findById() { return null; },
    async findByName(name) { return findResult && findResult.name === name ? new Role(findResult.id, findResult.name, null, []) : null; },
    async create() { throw new Error("not implemented"); },
    async update() { throw new Error("not implemented"); },
    async delete() {},
    async countUsers() { return 0; },
    async countByIds() { return 0; },
    async listUserIdsByRoleIds() { return []; },
  };
}

describe("surveyHandlers", () => {
  it("createSurvey returns 201 with created survey", async () => {
    const res = makeRes();
    await makeCreateSurveyHandler(
      asExecute(async () => survey),
    )(
      makeReq({ body: { title: "Q1", type: "NORMAL", roleIds: [], assignAllRoles: true } }),
      res,
    );
    assert.equal(res.statusCode, 201);
  });

  it("createSurvey returns 400 on invalid body", async () => {
    const res = makeRes();
    await makeCreateSurveyHandler(
      asExecute(async () => survey),
    )(makeReq({ body: {} }), res);
    assert.equal(res.statusCode, 400);
  });

  it("createSurvey returns 400 on InvalidRoleAssignmentError", async () => {
    const res = makeRes();
    await makeCreateSurveyHandler(
      asExecute(async () => { throw new InvalidRoleAssignmentError("bad"); }),
    )(
      makeReq({ body: { title: "Q1", type: "NORMAL", roleIds: [], assignAllRoles: true } }),
      res,
    );
    assert.equal(res.statusCode, 400);
  });

  it("listSurveys returns the list", async () => {
    const res = makeRes();
    await makeListSurveysHandler(
      asExecute(async () => ({ items: [survey], total: 1 })),
      makeRoleRepo({ id: "r1", name: "employee" }),
    )(makeReq({ query: { sortBy: "createdAt", order: "desc", page: "1", pageSize: "10" } }), res);
    assert.equal(res.statusCode, 200);
  });

  it("getSurveyAnalytics returns 404 for unknown survey", async () => {
    const res = makeRes();
    await makeGetSurveyAnalyticsHandler(
      asExecute(async () => { throw new SurveyNotFoundError(); }),
    )(makeReq({ params: { id: GHOST_ID } }), res);
    assert.equal(res.statusCode, 404);
  });

  it("getSurveyAnalytics returns analytics", async () => {
    const res = makeRes();
    const analytics = { surveyId: SURVEY_ID, title: "Q1", type: "NORMAL", totalResponses: 3, breakdown: [] };
    await makeGetSurveyAnalyticsHandler(
      asExecute(async () => analytics),
    )(makeReq({ params: { id: SURVEY_ID } }), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, analytics);
  });

  it("submitResponse returns 201", async () => {
    const res = makeRes();
    await makeSubmitSurveyResponseHandler(
      asExecute(async () => {}),
      makeRoleRepo({ id: "r1", name: "employee" }),
    )(
      makeReq({ params: { id: SURVEY_ID }, body: { value: "yes" } }),
      res,
    );
    assert.equal(res.statusCode, 201);
  });

  it("submitResponse returns 404 for unknown survey", async () => {
    const res = makeRes();
    await makeSubmitSurveyResponseHandler(
      asExecute(async () => { throw new SurveyNotFoundError(); }),
      makeRoleRepo({ id: "r1", name: "employee" }),
    )(
      makeReq({ params: { id: GHOST_ID }, body: { value: "yes" } }),
      res,
    );
    assert.equal(res.statusCode, 404);
  });

  it("submitResponse returns 400 for closed survey", async () => {
    const res = makeRes();
    await makeSubmitSurveyResponseHandler(
      asExecute(async () => { throw new SurveyClosedError(); }),
      makeRoleRepo({ id: "r1", name: "employee" }),
    )(
      makeReq({ params: { id: SURVEY_ID }, body: { value: "yes" } }),
      res,
    );
    assert.equal(res.statusCode, 400);
  });

  it("submitResponse returns 409 for already answered", async () => {
    const res = makeRes();
    await makeSubmitSurveyResponseHandler(
      asExecute(async () => { throw new SurveyAlreadyAnsweredError(); }),
      makeRoleRepo({ id: "r1", name: "employee" }),
    )(
      makeReq({ params: { id: SURVEY_ID }, body: { value: "yes" } }),
      res,
    );
    assert.equal(res.statusCode, 409);
  });

  it("closeSurvey returns 204 as creator", async () => {
    const res = makeRes();
    await makeCloseSurveyHandler(
      asExecute(async () => {}),
    )(makeReq({ params: { id: SURVEY_ID } }), res);
    assert.equal(res.statusCode, 204);
  });

  it("closeSurvey returns 403 for non-creator", async () => {
    const res = makeRes();
    await makeCloseSurveyHandler(
      asExecute(async () => { throw new NotSurveyCreatorError(); }),
    )(makeReq({ params: { id: SURVEY_ID } }), res);
    assert.equal(res.statusCode, 403);
  });

  it("deleteSurvey returns 204", async () => {
    const res = makeRes();
    await makeDeleteSurveyHandler(
      asExecute(async () => {}),
    )(makeReq({ params: { id: SURVEY_ID } }), res);
    assert.equal(res.statusCode, 204);
  });

  it("deleteSurvey returns 404 for unknown survey", async () => {
    const res = makeRes();
    await makeDeleteSurveyHandler(
      asExecute(async () => { throw new SurveyNotFoundError(); }),
    )(makeReq({ params: { id: GHOST_ID } }), res);
    assert.equal(res.statusCode, 404);
  });

  it("handler maps unexpected errors to 500", async () => {
    const res = makeRes();
    await makeCreateSurveyHandler(
      asExecute(async () => { throw new Error("boom"); }),
    )(
      makeReq({ body: { title: "Q1", type: "NORMAL", roleIds: [], assignAllRoles: true } }),
      res,
    );
    assert.equal(res.statusCode, 500);
  });
});
