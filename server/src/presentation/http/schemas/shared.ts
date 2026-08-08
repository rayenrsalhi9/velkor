import { z } from "zod";

export const nameField = z.string().trim().min(1).max(100);
export const descriptionField = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .optional();
export const idParamSchema = z.object({ id: z.string().uuid() });

export const hasAtLeastOneField = <T extends object>(data: T): boolean =>
  Object.keys(data).length > 0;
