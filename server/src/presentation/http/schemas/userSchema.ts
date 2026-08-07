import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(128),
  roleId: z.string().uuid(),
});

export const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(1).max(100).optional(),
    roleId: z.string().uuid().optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});
