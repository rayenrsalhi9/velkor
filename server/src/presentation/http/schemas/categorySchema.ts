import { z } from "zod";
import {
  nameField,
  descriptionField,
  qQueryField,
  orderQueryField,
  pageQueryField,
  pageSizeQueryField,
} from "./shared.js";

export const createCategorySchema = z.object({
  name: nameField,
  description: descriptionField,
});

export const updateCategorySchema = z.object({
  name: nameField.optional(),
  description: descriptionField,
});

export const categoriesListQuerySchema = z
  .object({
    q: qQueryField,
    sortBy: z.enum(["name", "createdAt"]).default("name"),
    order: orderQueryField,
    page: pageQueryField,
    pageSize: pageSizeQueryField,
  })
  .strict();