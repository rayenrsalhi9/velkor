import { z } from "zod";
import {
  qQueryField,
  orderQueryField,
  pageQueryField,
  pageSizeQueryField,
} from "./shared.js";

const roleIdsField = z.preprocess(
  (value) =>
    value === undefined ? [] : Array.isArray(value) ? value : [value],
  z.array(z.string().uuid()),
);

export const createSurveySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(500).nullable().optional(),
    type: z.enum(["NORMAL", "SATISFACTION", "RATING"]),
    roleIds: roleIdsField,
    assignAllRoles: z.preprocess((value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    }, z.boolean()),
  })
  .strict();

export const surveysListQuerySchema = z
  .object({
    q: qQueryField,
    sortBy: z.enum(["title", "createdAt"]).default("title"),
    order: orderQueryField,
    page: pageQueryField,
    pageSize: pageSizeQueryField,
  })
  .strict();

export const submitResponseSchema = z
  .object({
    value: z.union([z.string(), z.number()]),
  })
  .strict();
