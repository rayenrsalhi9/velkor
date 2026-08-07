import { z } from "zod";

const claimList = z.array(z.string());

export const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  claims: claimList.default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  claims: claimList.optional(),
});

export const roleIdParamSchema = z.object({
  id: z.string().uuid(),
});
