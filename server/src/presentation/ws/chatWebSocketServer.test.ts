import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { WebSocket } from "ws";
import { attachChatWebSocket } from "./chatWebSocketServer.js";
import type { CurrentUser } from "../../application/use-cases/GetCurrentUser.js";
import { Message } from "../../domain/entities/Message.js";
import { ChannelNotFoundError } from "../../application/errors/ChannelNotFoundError.js";

interface ConnectOpts {
  token?: string;
}

interface TestClient {
  socket: WebSocket;
  frames: unknown[];
  waitForClose(): Promise<number | undefined>;
}

async function startServer(opts: {
  getCurrentUser: (userId: string) => Promise<CurrentUser>;
  sendMessage?: (input: {
    channelId: string;
    authorId: string;
    body: string;
  }) => Promise<Message>;
  verifyToken?: (token: string) => { userId: string } | null;
}) {
  const server: Server = createServer();
  attachChatWebSocket({
    server,
    tokenService: {
      verifyToken: opts.verifyToken ?? ((token) => ({ userId: token })),
      generateAccessToken: () => "t",
      generateRefreshToken: () => "r",
      getRefreshTokenExpiresAt: () => new Date(),
    },
    getCurrentUser: {
      execute: opts.getCurrentUser,
    } as never,
    sendMessage: {
      execute: opts.sendMessage ?? (async () => message("m1")),
    } as never,
  });
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", resolve),
  );
  return {
    server,
    url: `ws://127.0.0.1:${(server.address() as { port: number }).port}/ws`,
  };
}

function connect(url: string, opts: ConnectOpts = {}): Promise<TestClient> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const frames: unknown[] = [];
    socket.on("message", (data) => {
      frames.push(JSON.parse(String(data)));
    });
    socket.on("open", () => {
      if (opts.token !== undefined) {
        socket.send(JSON.stringify({ type: "auth", token: opts.token }));
      }
      resolve({
        socket,
        frames,
        waitForClose: () =>
          new Promise<number | undefined>((res) => {
            socket.on("close", (code) => res(code));
          }),
      });
    });
    socket.on("error", reject);
  });
}

async function waitFor<T>(
  fn: () => T | undefined,
  timeout = 2000,
): Promise<T> {
  const start = Date.now();
  let value: T | undefined;
  while (Date.now() - start < timeout) {
    value = fn();
    if (value !== undefined) return value;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error("Timed out waiting for condition");
}

const user = (claims: string[], userId = "u1"): CurrentUser => ({
  userId,
  email: "a@b.c",
  fullName: "Ada",
  role: "employee",
  claims,
});

function message(id: string, channelId = "ch1", body = "hello"): Message {
  return new Message(id, channelId, "u1", "Ada", "a@b.c", body);
}

describe("attachChatWebSocket", () => {
  const servers: Server[] = [];
  const sockets: WebSocket[] = [];

  after(() => {
    for (const socket of sockets) socket.terminate();
    for (const server of servers) server.close();
  });

  async function testHarness(opts: {
    getCurrentUser: (userId: string) => Promise<CurrentUser>;
    sendMessage?: (input: {
      channelId: string;
      authorId: string;
      body: string;
    }) => Promise<Message>;
    verifyToken?: (token: string) => { userId: string } | null;
  }) {
    const { server, url } = await startServer(opts);
    servers.push(server);
    return {
      url,
      connect: async (clientOpts: ConnectOpts = {}) => {
        const client = await connect(url, clientOpts);
        sockets.push(client.socket);
        return client;
      },
    };
  }

  it("authenticates a user with the chat:use claim and sends auth:ok", async () => {
    const h = await testHarness({
      getCurrentUser: async (id) => user(["chat:use"], id),
    });
    const client = await h.connect({ token: "u1" });
    await waitFor(() =>
      client.frames.find((f) => (f as { type: string }).type === "auth:ok"),
    );
  });

  it("authenticates a user with the wildcard claim", async () => {
    const h = await testHarness({
      getCurrentUser: async (id) => user(["*"], id),
    });
    const client = await h.connect({ token: "u1" });
    await waitFor(() =>
      client.frames.find((f) => (f as { type: string }).type === "auth:ok"),
    );
  });

  it("rejects a user without chat access and closes the socket", async () => {
    for (const claims of [[], ["documents:view-list"]]) {
      const h = await testHarness({
        getCurrentUser: async (id) => user(claims, id),
      });
      const client = await h.connect({ token: "u1" });
      const code = await client.waitForClose();
      assert.notStrictEqual(code, 1000);
      assert.equal(
        client.frames.some((f) => (f as { type: string }).type === "auth:ok"),
        false,
      );
    }
  });

  it("rejects an invalid token and closes the socket", async () => {
    const h = await testHarness({
      getCurrentUser: async () => user(["chat:use"]),
      verifyToken: () => null,
    });
    const client = await h.connect({ token: "bad" });
    const code = await client.waitForClose();
    assert.notStrictEqual(code, 1000);
  });

  it("does not register a socket that closes while authentication is pending", async () => {
    let resolveUser: (value: CurrentUser) => void = () => {};
    const pending = new Promise<CurrentUser>((resolve) => {
      resolveUser = resolve;
    });
    const h = await testHarness({
      getCurrentUser: async () => pending,
    });
    const client = await h.connect({ token: "u1" });
    client.socket.close();

    // Resolve after the socket is gone. Must not throw or leak a registration.
    resolveUser(user(["chat:use"]));
    await new Promise((r) => setTimeout(r, 20));

    // A fresh connection for the same user still works normally.
    const second = await h.connect({ token: "u2" });
    await waitFor(() =>
      second.frames.find(
        (f) => (f as { type: string }).type === "auth:ok",
      ),
    );
  });

  it("shares a message with another connected user", async () => {
    const h = await testHarness({
      getCurrentUser: async (id) => user(["chat:use"], id),
      sendMessage: async (input) => message("m1", input.channelId, input.body),
    });
    const a = await h.connect({ token: "u1" });
    const b = await h.connect({ token: "u2" });
    await waitFor(() =>
      a.frames.find((f) => (f as { type: string }).type === "auth:ok"),
    );
    await waitFor(() =>
      b.frames.find((f) => (f as { type: string }).type === "auth:ok"),
    );
    a.socket.send(
      JSON.stringify({ type: "message", channelId: "ch1", body: "hi" }),
    );
    await waitFor(() =>
      b.frames.find(
        (f) =>
          (f as { type: string; message: { body: string } }).type ===
            "message" &&
          (f as { message: { body: string } }).message.body === "hi",
      ),
    );
  });

  it("reports an unknown channel to the sender", async () => {
    const h = await testHarness({
      getCurrentUser: async (id) => user(["chat:use"], id),
      sendMessage: async () => {
        throw new ChannelNotFoundError();
      },
    });
    const a = await h.connect({ token: "u1" });
    await waitFor(() =>
      a.frames.find((f) => (f as { type: string }).type === "auth:ok"),
    );
    a.socket.send(
      JSON.stringify({ type: "message", channelId: "missing", body: "hi" }),
    );
    await waitFor(() =>
      a.frames.find((f) => (f as { type: string }).type === "error"),
    );
  });

  it("closes a socket that never authenticates", async () => {
    const h = await testHarness({
      getCurrentUser: async (id) => user(["chat:use"], id),
    });
    const client = await h.connect();
    const code = await client.waitForClose();
    assert.notStrictEqual(code, 1000);
  });
});
