import { z } from "zod";
import {
  qQueryField,
  orderQueryField,
  pageQueryField,
  pageSizeQueryField,
  hasAtLeastOneField,
} from "./shared.js";

export const documentsListQuerySchema = z
  .object({
    q: qQueryField,
    sortBy: z.enum(["displayName", "createdAt"]).default("displayName"),
    order: orderQueryField,
    page: pageQueryField,
    pageSize: pageSizeQueryField,
    scope: z.enum(["all", "assigned"]).default("all"),
  })
  .strict();

export const updateDocumentSchema = z
  .object({
    displayName: z.string().trim().min(1).max(200).optional(),
    categoryId: z.string().uuid().optional(),
    roleIds: z.array(z.string().uuid()).optional(),
    assignAllRoles: z.boolean().optional(),
  })
  .strict()
  .refine(hasAtLeastOneField, {
    message: "Provide at least one field to update",
  });

const roleIdsField = z.preprocess(
  (value) =>
    value === undefined ? [] : Array.isArray(value) ? value : [value],
  z.array(z.string().uuid()),
);

export const uploadDocumentSchema = z
  .object({
    displayName: z.string().trim().max(200).optional(),
    categoryId: z.string().uuid(),
    roleIds: roleIdsField,
    assignAllRoles: z.preprocess(
      (value) => {
        if (value === "true") return true;
        if (value === "false") return false;
        return value;
      },
      z.boolean(),
    ),
  })
  .strict();
