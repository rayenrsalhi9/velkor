import { z } from "zod";
import { nameField, descriptionField } from "./shared.js";

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
