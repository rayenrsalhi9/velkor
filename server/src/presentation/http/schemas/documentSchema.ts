import { z } from "zod";
import {
  qQueryField,
  orderQueryField,
  pageQueryField,
  pageSizeQueryField,
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
  .strict();
