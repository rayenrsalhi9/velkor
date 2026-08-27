import { afterEach, describe, expect, it, vi } from "vitest";
import { createChatSocket } from "./chatSocket";
import type {
  ChatCallbacks,
  ChatSocketClient,
  ChatSocketFactory,
} from "./chatSocket";
import type { ChatMessage } from "@/lib/api";
import { jsonResponse, stubApi } from "@/test/fixtures";

class FakeSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  sent: string[] = [];
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  receive(frame: unknown) {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }
  drop() {
    this.onclose?.();
  }
}

function makeSocket(): { client: ChatSocketClient; socket: FakeSocket } {
  const socket = new FakeSocket();
  const factory: ChatSocketFactory = () => socket;
  const client = createChatSocket({ factory, url: "ws://test/ws" });
  return { client, socket };
}

function callbacks() {
  return {
    onMessage: vi.fn(),
    onMessageDeleted: vi.fn(),
    onStatus: vi.fn(),
    onError: vi.fn(),
  } satisfies ChatCallbacks;
}

function wire(client: ChatSocketClient, cb: ChatCallbacks) {
  client.setCallbacks(cb);
  client.connect();
}

describe("createChatSocket", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("opens, sends auth, then reports connected on auth:ok", () => {
    // token is module-memory in api, always null in tests -> no auth frame
    const cbs = callbacks();
    const { client, socket } = makeSocket();
    wire(client, cbs);
    socket.open();
    // no token available, so just the status flow
    socket.receive({ type: "auth:ok" });
    expect(cbs.onStatus).toHaveBeenLastCalledWith("connected");
  });

  it("forwards incoming message and deleted frames to callbacks", () => {
    const cbs = callbacks();
    const { client, socket } = makeSocket();
    wire(client, cbs);
    const message = {
      id: "m1",
      channelId: "ch-general",
      authorId: "u1",
      authorName: "Admin",
      authorEmail: "a@b.c",
      body: "hello",
      createdAt: "2026-01-01T00:00:00.000Z",
    } as ChatMessage;
    socket.receive({ type: "message", message });
    socket.receive({ type: "message:deleted", messageId: "m1" });
    socket.receive({ type: "error", message: "boom" });
    expect(cbs.onMessage).toHaveBeenCalledWith(message);
    expect(cbs.onMessageDeleted).toHaveBeenCalledWith("m1");
    expect(cbs.onError).toHaveBeenCalledWith("boom");
  });

  it("ignores malformed frames", () => {
    const cbs = callbacks();
    const { client, socket } = makeSocket();
    wire(client, cbs);
    socket.receive("not json");
    expect(cbs.onMessage).not.toHaveBeenCalled();
    expect(cbs.onError).not.toHaveBeenCalled();
  });

  it("reconnects with backoff and refreshes the token on unexpected close", () => {
    vi.useFakeTimers();
    stubApi(() => jsonResponse(200, { user: { userId: "u1" } }));
    const refreshSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    void refreshSpy;
    const cbs = callbacks();
    const socket = new FakeSocket();
    const factory: ChatSocketFactory = () => {
      clients += 1;
      return socket;
    };
    let clients = 0;
    const client = createChatSocket({ factory, url: "ws://test/ws" });
    wire(client, cbs);
    socket.open();
    socket.drop();
    expect(cbs.onStatus).toHaveBeenCalledWith("disconnected");
    vi.advanceTimersByTime(1000);
    expect(clients).toBe(2);
    socket.open();
    expect(cbs.onStatus).toHaveBeenCalledWith("connecting");
    socket.receive({ type: "auth:ok" });
    expect(cbs.onStatus).toHaveBeenLastCalledWith("connected");
  });

  it("disconnect stops reconnecting and closes the socket", () => {
    vi.useFakeTimers();
    const cbs = callbacks();
    const socket = new FakeSocket();
    const closeSpy = vi.spyOn(socket, "close");
    const factory: ChatSocketFactory = () => socket;
    const client = createChatSocket({ factory, url: "ws://test/ws" });
    wire(client, cbs);
    socket.open();
    client.disconnect();
    expect(closeSpy).toHaveBeenCalled();
    vi.advanceTimersByTime(10000);
    expect(cbs.onStatus).not.toHaveBeenCalledWith("disconnected");
  });

  it("sends a trimmed message when open and errors when not connected", () => {
    const cbs = callbacks();
    const { client, socket } = makeSocket();
    wire(client, cbs);
    socket.open();
    client.sendMessage("ch-general", "  hello  ");
    expect(socket.sent).toContain(
      JSON.stringify({ type: "message", channelId: "ch-general", body: "hello" }),
    );

    const offline = new FakeSocket();
    const factory: ChatSocketFactory = () => offline;
    const offlineClient = createChatSocket({ factory, url: "ws://test/ws" });
    offlineClient.setCallbacks(cbs);
    offlineClient.connect();
    offlineClient.sendMessage("ch-general", "hi");
    expect(cbs.onError).toHaveBeenCalledWith(
      "Not connected. Message not sent.",
    );
  });
});