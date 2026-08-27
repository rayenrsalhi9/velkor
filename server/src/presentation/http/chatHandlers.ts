import type { Request, Response } from "express";
import type { ListChannels } from "../../application/use-cases/ListChannels.js";
import type { CreateChannel } from "../../application/use-cases/CreateChannel.js";
import type { DeleteChannel } from "../../application/use-cases/DeleteChannel.js";
import type { ListMessages } from "../../application/use-cases/ListMessages.js";
import type { SoftDeleteMessage } from "../../application/use-cases/SoftDeleteMessage.js";
import { ChannelNotFoundError } from "../../application/errors/ChannelNotFoundError.js";
import { ChannelNameConflictError } from "../../application/errors/ChannelNameConflictError.js";
import { MessageNotFoundError } from "../../application/errors/MessageNotFoundError.js";
import { NotChannelOwnerError } from "../../application/errors/NotChannelOwnerError.js";
import { NotMessageAuthorError } from "../../application/errors/NotMessageAuthorError.js";
import { WILDCARD_CLAIM } from "../../application/claims/claimsCatalog.js";
import {
  createChannelSchema,
  channelParamSchema,
  messagesQuerySchema,
} from "./schemas/chatSchema.js";

export function makeListChannelsHandler(listChannels: ListChannels) {
  return async (req: Request, res: Response) => {
    try {
      return res.json(await listChannels.execute());
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeCreateChannelHandler(createChannel: CreateChannel) {
  return async (req: Request, res: Response) => {
    const parsed = createChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const channel = await createChannel.execute({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        createdById: req.currentUser!.userId,
      });
      return res.status(201).json(channel);
    } catch (err) {
      if (err instanceof ChannelNameConflictError) {
        return res.status(409).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeDeleteChannelHandler(deleteChannel: DeleteChannel) {
  return async (req: Request, res: Response) => {
    const params = channelParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const claims = req.currentUser?.claims ?? [];
    try {
      await deleteChannel.execute(params.data.id, {
        userId: req.currentUser!.userId,
        isAdmin: claims.includes(WILDCARD_CLAIM),
      });
      return res.status(204).send();
    } catch (err) {
      if (err instanceof ChannelNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof NotChannelOwnerError) {
        return res.status(403).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeListMessagesHandler(listMessages: ListMessages) {
  return async (req: Request, res: Response) => {
    const params = channelParamSchema.safeParse(req.params);
    const query = messagesQuerySchema.safeParse(req.query);
    if (!params.success || !query.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const messages = await listMessages.execute({
        channelId: params.data.id,
        ...(query.data.before ? { before: new Date(query.data.before) } : {}),
        limit: query.data.limit,
      });
      return res.json(messages);
    } catch (err) {
      if (err instanceof ChannelNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeSoftDeleteMessageHandler(
  softDeleteMessage: SoftDeleteMessage,
  options?: { onDeleted?: (messageId: string) => void },
) {
  return async (req: Request, res: Response) => {
    const params = channelParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      await softDeleteMessage.execute(params.data.id, req.currentUser!.userId);
      options?.onDeleted?.(params.data.id);
      return res.status(204).send();
    } catch (err) {
      if (err instanceof MessageNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof NotMessageAuthorError) {
        return res.status(403).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}