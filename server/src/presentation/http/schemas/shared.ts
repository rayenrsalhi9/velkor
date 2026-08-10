import { z } from "zod";

export const nameField = z.string().trim().min(1).max(100);
export const descriptionField = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .optional();
export const idParamSchema = z.object({ id: z.string().uuid() });

export const qQueryField = z.string().trim().max(100).optional();
export const orderQueryField = z.enum(["asc", "desc"]).default("asc");
export const pageQueryField = z.coerce.number().int().min(1).default(1);
export const pageSizeQueryField = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(10);

export const hasAtLeastOneField = <T extends object>(data: T): boolean =>
  Object.keys(data).length > 0;
