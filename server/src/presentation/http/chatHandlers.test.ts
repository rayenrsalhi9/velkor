import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import {
  makeListChannelsHandler,
  makeCreateChannelHandler,
  makeDeleteChannelHandler,
  makeListMessagesHandler,
  makeSoftDeleteMessageHandler,
} from "./chatHandlers.js";
import { ChannelNotFoundError } from "../../application/errors/ChannelNotFoundError.js";
import { ChannelNameConflictError } from "../../application/errors/ChannelNameConflictError.js";
import { NotChannelOwnerError } from "../../application/errors/NotChannelOwnerError.js";
import { MessageNotFoundError } from "../../application/errors/MessageNotFoundError.js";
import { NotMessageAuthorError } from "../../application/errors/NotMessageAuthorError.js";

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

function makeReq(over: Partial<Request> = {}, userId = "u1"): Request {
  return {
    currentUser: {
      userId,
      email: "a@b.c",
      fullName: "Ada",
      role: "employee",
      claims: [],
    },
    ...over,
  } as Request;
}

const asExecute = (fn: unknown) => ({ execute: fn }) as never;

const CHANNEL_ID = "c0a5e1a1-0000-4000-8000-000000000001";
const MESSAGE_ID = "c0a5e1a1-0000-4000-8000-000000000099";

describe("chatHandlers", () => {
  it("listChannels returns the channels", async () => {
    const res = makeRes();
    await makeListChannelsHandler(
      asExecute(async () => [{ id: "ch1" }]),
    )(makeReq(), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ id: "ch1" }]);
  });

  it("listChannels maps unexpected errors to 500", async () => {
    const res = makeRes();
    await makeListChannelsHandler(
      asExecute(async () => {
        throw new Error("boom");
      }),
    )(makeReq(), res);
    assert.equal(res.statusCode, 500);
  });

  it("createChannel creates and returns 201", async () => {
    const res = makeRes();
    const channel = { id: "ch1", name: "Ops", description: null };
    await makeCreateChannelHandler(asExecute(async () => channel))(
      makeReq({ body: { name: "Ops", description: "talk" } }),
      res,
    );
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, channel);
  });

  it("createChannel rejects an invalid body with 400", async () => {
    const res = makeRes();
    await makeCreateChannelHandler(asExecute(async () => ({})))(
      makeReq({ body: { name: "" } }),
      res,
    );
    assert.equal(res.statusCode, 400);
  });

  it("createChannel maps a name conflict to 409", async () => {
    const res = makeRes();
    await makeCreateChannelHandler(
      asExecute(async () => {
        throw new ChannelNameConflictError();
      }),
    )(makeReq({ body: { name: "Ops" } }), res);
    assert.equal(res.statusCode, 409);
  });

  it("deleteChannel deletes and returns 204", async () => {
    const res = makeRes();
    await makeDeleteChannelHandler(asExecute(async () => undefined))(
      makeReq({ params: { id: CHANNEL_ID } }),
      res,
    );
    assert.equal(res.statusCode, 204);
  });

  it("deleteChannel maps a missing channel to 404", async () => {
    const res = makeRes();
    await makeDeleteChannelHandler(
      asExecute(async () => {
        throw new ChannelNotFoundError();
      }),
    )(makeReq({ params: { id: CHANNEL_ID } }), res);
    assert.equal(res.statusCode, 404);
  });

  it("deleteChannel maps a non-owner to 403", async () => {
    const res = makeRes();
    await makeDeleteChannelHandler(
      asExecute(async () => {
        throw new NotChannelOwnerError();
      }),
    )(makeReq({ params: { id: CHANNEL_ID } }, "u2"), res);
    assert.equal(res.statusCode, 403);
  });

  it("deleteChannel rejects invalid params with 400", async () => {
    const res = makeRes();
    await makeDeleteChannelHandler(asExecute(async () => undefined))(
      makeReq({ params: {} }),
      res,
    );
    assert.equal(res.statusCode, 400);
  });

  it("listMessages returns messages", async () => {
    const res = makeRes();
    const messages = [{ id: "m1" }];
    await makeListMessagesHandler(asExecute(async () => messages))(
      makeReq({ params: { id: CHANNEL_ID }, query: { limit: "10" } }),
      res,
    );
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, messages);
  });

  it("listMessages passes the before cursor to the use case", async () => {
    const res = makeRes();
    let captured: unknown;
    await makeListMessagesHandler(
      asExecute(async (params: unknown) => {
        captured = params;
        return [];
      }),
    )(makeReq({ params: { id: CHANNEL_ID }, query: { limit: "10", before: "m9" } }), res);
    assert.deepEqual(captured, {
      channelId: CHANNEL_ID,
      limit: 10,
      before: "m9",
    });
  });

  it("listMessages maps a missing channel to 404", async () => {
    const res = makeRes();
    await makeListMessagesHandler(
      asExecute(async () => {
        throw new ChannelNotFoundError();
      }),
    )(makeReq({ params: { id: CHANNEL_ID }, query: {} }), res);
    assert.equal(res.statusCode, 404);
  });

  it("listMessages rejects an invalid query with 400", async () => {
    const res = makeRes();
    await makeListMessagesHandler(asExecute(async () => []))(
      makeReq({ params: { id: CHANNEL_ID }, query: { limit: "0" } }),
      res,
    );
    assert.equal(res.statusCode, 400);
  });

  it("softDeleteMessage deletes and returns 204", async () => {
    const res = makeRes();
    let deleted: string | undefined;
    await makeSoftDeleteMessageHandler(
      asExecute(async (id: string) => {
        deleted = id;
      }),
    )(makeReq({ params: { id: MESSAGE_ID } }), res);
    assert.equal(res.statusCode, 204);
    assert.equal(deleted, MESSAGE_ID);
  });

  it("softDeleteMessage maps a missing message to 404", async () => {
    const res = makeRes();
    await makeSoftDeleteMessageHandler(
      asExecute(async () => {
        throw new MessageNotFoundError();
      }),
    )(makeReq({ params: { id: MESSAGE_ID } }), res);
    assert.equal(res.statusCode, 404);
  });

  it("softDeleteMessage maps a non-author to 403", async () => {
    const res = makeRes();
    await makeSoftDeleteMessageHandler(
      asExecute(async () => {
        throw new NotMessageAuthorError();
      }),
    )(makeReq({ params: { id: MESSAGE_ID } }), res);
    assert.equal(res.statusCode, 403);
  });

  it("softDeleteMessage rejects invalid params with 400", async () => {
    const res = makeRes();
    await makeSoftDeleteMessageHandler(asExecute(async () => undefined))(
      makeReq({ params: {} }),
      res,
    );
    assert.equal(res.statusCode, 400);
  });
});
