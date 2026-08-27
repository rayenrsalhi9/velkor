import { z } from "zod";
import { nameField, descriptionField, idParamSchema } from "./shared.js";

export const createChannelSchema = z
  .object({
    name: nameField,
    description: descriptionField,
  })
  .strict();

export const messagesQuerySchema = z
  .object({
    before: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export { idParamSchema as channelParamSchema };