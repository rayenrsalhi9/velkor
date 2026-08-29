import { z } from "zod";

export const notificationsListQuerySchema = z
  .object({
    before: z.iso.datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  })
  .strict();

export const readNotificationsSchema = z
  .object({
    ids: z.array(z.string().uuid()).max(200).optional(),
  })
  .strict();
