import { getAccessToken, refresh } from "@/lib/api";
import type { ChatMessage } from "@/lib/api";

export interface ChatSocketLike {
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  readyState: number;
  send(data: string): void;
  close(): void;
}

export type ChatSocketFactory = (url: string) => ChatSocketLike;

export type ChatStatus = "connecting" | "connected" | "disconnected";

export interface ChatCallbacks {
  onMessage: (message: ChatMessage) => void;
  onMessageDeleted: (messageId: string) => void;
  onStatus: (status: ChatStatus) => void;
  onError: (message: string) => void;
}

export interface ChatSocketClient {
  connect(): void;
  disconnect(): void;
  sendMessage(channelId: string, body: string): void;
  setCallbacks(callbacks: ChatCallbacks): void;
}

const OPEN = 1;
const RETRY_DELAYS = [1000, 2000, 4000, 8000];

export function createChatSocket(options?: {
  factory?: ChatSocketFactory;
  url?: string;
}): ChatSocketClient {
  const factory =
    options?.factory ??
    ((url) => new WebSocket(url) as unknown as ChatSocketLike);
  const wsUrl =
    options?.url ??
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;

  let socket: ChatSocketLike | null = null;
  let callbacks: ChatCallbacks | null = null;
  let closed = false;
  let intentionalClose = false;
  let retryIndex = 0;

  function setStatus(status: ChatStatus) {
    callbacks?.onStatus(status);
  }

  function scheduleReconnect() {
    const delay = RETRY_DELAYS[Math.min(retryIndex, RETRY_DELAYS.length - 1)];
    retryIndex += 1;
    window.setTimeout(connect, delay);
  }

  function connect() {
    if (closed) return;
    setStatus("connecting");
    try {
      socket = factory(wsUrl);
    } catch {
      scheduleReconnect();
      return;
    }
    socket.onopen = () => {
      retryIndex = 0;
      const token = getAccessToken();
      if (token) socket?.send(JSON.stringify({ type: "auth", token }));
    };
    socket.onmessage = (event) => {
      if (!callbacks) return;
      let frame: { type?: unknown } & Record<string, unknown>;
      try {
        frame = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (frame.type === "message") {
        callbacks.onMessage(frame.message as ChatMessage);
      } else if (frame.type === "message:deleted") {
        callbacks.onMessageDeleted(String(frame.messageId));
      } else if (frame.type === "error") {
        callbacks.onError(String(frame.message ?? "Chat error"));
      } else if (frame.type === "auth:ok") {
        setStatus("connected");
      }
    };
    socket.onerror = () => {
      // close follows and drives reconnection
    };
    socket.onclose = () => {
      if (closed || intentionalClose) return;
      setStatus("disconnected");
      void refresh();
      scheduleReconnect();
    };
  }

  return {
    connect,
    disconnect() {
      intentionalClose = true;
      closed = true;
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      socket = null;
    },
    sendMessage(channelId: string, body: string) {
      const text = body.trim();
      if (!text) return;
      if (socket && socket.readyState === OPEN) {
        socket.send(JSON.stringify({ type: "message", channelId, body: text }));
      } else {
        callbacks?.onError("Not connected. Message not sent.");
      }
    },
    setCallbacks(next: ChatCallbacks) {
      callbacks = next;
    },
  };
}
