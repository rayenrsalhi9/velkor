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
  })
  .strict();