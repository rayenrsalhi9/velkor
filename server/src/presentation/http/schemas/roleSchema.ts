import { z } from "zod";
import {
  nameField,
  descriptionField,
  qQueryField,
  orderQueryField,
  pageQueryField,
  pageSizeQueryField,
} from "./shared.js";

const claimList = z.array(z.string());

export const createRoleSchema = z.object({
  name: nameField,
  description: descriptionField,
  claims: claimList.default([]),
});

export const updateRoleSchema = z.object({
  name: nameField.optional(),
  description: descriptionField,
  claims: claimList.optional(),
});

export const rolesListQuerySchema = z
  .object({
    q: qQueryField,
    sortBy: z.enum(["name", "createdAt"]).default("name"),
    order: orderQueryField,
    page: pageQueryField,
    pageSize: pageSizeQueryField,
  })
  .strict();
