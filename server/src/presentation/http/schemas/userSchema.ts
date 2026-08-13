import { z } from "zod";
import {
  nameField,
  hasAtLeastOneField,
  qQueryField,
  orderQueryField,
  pageQueryField,
  pageSizeQueryField,
} from "./shared.js";

export const passwordSchema = z
  .string()
  .min(8)
  .superRefine((value, ctx) => {
    if (Buffer.byteLength(value, "utf8") > 72) {
      ctx.addIssue({
        code: "custom",
        message: "Password must be at most 72 bytes",
      });
    }
    if (!/\d/.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Password must contain a number",
      });
    }
    if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Password must contain a special character",
      });
    }
  });

export const createUserSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    fullName: nameField,
    password: passwordSchema,
    roleId: z.string().uuid(),
  })
  .strict();

export const updateUserSchema = z
  .object({
    fullName: nameField.optional(),
    roleId: z.string().uuid().optional(),
    password: passwordSchema.optional(),
  })
  .strict()
  .refine(hasAtLeastOneField, {
    message: "Provide at least one field to update",
  });

export const updateProfileSchema = z
  .object({
    fullName: nameField.optional(),
    password: passwordSchema.optional(),
  })
  .strict()
  .refine(hasAtLeastOneField, {
    message: "Provide at least one field to update",
  });

export const usersListQuerySchema = z
  .object({
    q: qQueryField,
    sortBy: z.enum(["fullName", "email", "role", "createdAt"]).default("fullName"),
    order: orderQueryField,
    page: pageQueryField,
    pageSize: pageSizeQueryField,
  })
  .strict();
