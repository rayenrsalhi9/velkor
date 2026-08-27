import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import type { TokenService } from "../../application/ports/TokenService.js";
import type { GetCurrentUser } from "../../application/use-cases/GetCurrentUser.js";
import type { SendMessage } from "../../application/use-cases/SendMessage.js";
import type { Message } from "../../domain/entities/Message.js";
import { ChannelNotFoundError } from "../../application/errors/ChannelNotFoundError.js";
import { WILDCARD_CLAIM } from "../../application/claims/claimsCatalog.js";

export interface ChatSocketLayer {
  broadcastMessage(message: Message): void;
  broadcastMessageDeleted(messageId: string): void;
}

const AUTH_TIMEOUT_MS = 5000;
const MAX_BODY_LENGTH = 4000;
const CHAT_USE_CLAIM = "chat:use";

export function attachChatWebSocket(options: {
  server: Server;
  tokenService: TokenService;
  getCurrentUser: GetCurrentUser;
  sendMessage: SendMessage;
}): ChatSocketLayer {
  const { server, tokenService, getCurrentUser, sendMessage } = options;
  const wss = new WebSocketServer({ server, path: "/ws" });
  const socketsByUser = new Map<string, Set<WebSocket>>();

  function send(socket: WebSocket, frame: unknown) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(frame));
    }
  }

  function broadcast(frame: unknown) {
    const data = JSON.stringify(frame);
    for (const sockets of socketsByUser.values()) {
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      }
    }
  }

  wss.on("connection", (socket) => {
    let userId: string | null = null;
    let authStarted = false;
    const authTimer = setTimeout(() => {
      if (!userId) {
        socket.close(4001, "Authentication timeout");
      }
    }, AUTH_TIMEOUT_MS);

    socket.on("message", (raw) => {
      // WS authentication is a first-frame exchange: browsers cannot send
      // custom headers on the WebSocket handshake, so the access token rides
      // the first frame instead of the Bearer header.
      let frame: { type?: unknown } & Record<string, unknown>;
      try {
        frame = JSON.parse(String(raw));
      } catch {
        socket.close(4000, "Malformed frame");
        return;
      }
      if (typeof frame !== "object" || frame === null) {
        socket.close(4000, "Malformed frame");
        return;
      }

      if (frame.type === "auth") {
        if (userId || authStarted) return;
        authStarted = true;
        void authenticate(frame.token);
        return;
      }

      if (!userId) return;
      if (frame.type === "message") {
        void handleMessage(frame.channelId, frame.body);
        return;
      }
      send(socket, { type: "error", message: "Unknown frame type" });
    });

    socket.on("close", () => {
      clearTimeout(authTimer);
      if (!userId) return;
      const sockets = socketsByUser.get(userId);
      if (!sockets) return;
      sockets.delete(socket);
      if (sockets.size === 0) {
        socketsByUser.delete(userId);
      }
    });

    async function authenticate(token: unknown) {
      if (typeof token !== "string" || token.length === 0) {
        socket.close(4002, "Missing token");
        return;
      }
      const payload = tokenService.verifyToken(token, "access");
      if (!payload) {
        socket.close(4003, "Invalid token");
        return;
      }
      try {
        const user = await getCurrentUser.execute(payload.userId);
        if (socket.readyState !== WebSocket.OPEN) return;
        const claims = user.claims ?? [];
        if (
          !claims.includes(CHAT_USE_CLAIM) &&
          !claims.includes(WILDCARD_CLAIM)
        ) {
          socket.close(4003, "Unauthorized");
          return;
        }
        userId = user.userId;
        clearTimeout(authTimer);
        let sockets = socketsByUser.get(userId);
        if (!sockets) {
          sockets = new Set();
          socketsByUser.set(userId, sockets);
        }
        sockets.add(socket);
        send(socket, { type: "auth:ok" });
      } catch {
        socket.close(4003, "Invalid token");
      }
    }

    async function handleMessage(channelId: unknown, body: unknown) {
      if (typeof channelId !== "string" || typeof body !== "string") {
        send(socket, { type: "error", message: "Invalid message frame" });
        return;
      }
      const text = body.trim();
      if (!text || text.length > MAX_BODY_LENGTH) {
        send(socket, {
          type: "error",
          message: "Message must be 1-4000 characters",
        });
        return;
      }
      if (!userId) return;
      try {
        const message = await sendMessage.execute({
          channelId,
          authorId: userId,
          body: text,
        });
        broadcast({ type: "message", message });
      } catch (err) {
        if (err instanceof ChannelNotFoundError) {
          send(socket, { type: "error", message: err.message });
          return;
        }
        send(socket, { type: "error", message: "Failed to send message" });
      }
    }
  });

  return {
    broadcastMessage(message: Message) {
      broadcast({ type: "message", message });
    },
    broadcastMessageDeleted(messageId: string) {
      broadcast({ type: "message:deleted", messageId });
    },
  };
}
