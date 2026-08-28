import type { Request, Response } from "express";
import type { ListNotifications } from "../../application/use-cases/ListNotifications.js";
import type { MarkNotificationsRead } from "../../application/use-cases/MarkNotificationsRead.js";
import {
  notificationsListQuerySchema,
  readNotificationsSchema,
} from "./schemas/notificationSchema.js";

export function makeListNotificationsHandler(listNotifications: ListNotifications) {
  return async (req: Request, res: Response) => {
    const parsed = notificationsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query" });
    }
    try {
      const result = await listNotifications.execute(req.currentUser!.userId, parsed.data);
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeReadNotificationsHandler(markRead: MarkNotificationsRead) {
  return async (req: Request, res: Response) => {
    const parsed = readNotificationsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }
    try {
      if (parsed.data.ids && parsed.data.ids.length > 0) {
        await markRead.markRead(req.currentUser!.userId, parsed.data.ids);
      } else {
        await markRead.markAllRead(req.currentUser!.userId);
      }
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
