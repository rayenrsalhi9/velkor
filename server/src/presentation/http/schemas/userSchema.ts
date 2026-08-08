import { z } from "zod";

export const passwordSchema = z.string().min(8).superRefine((value, ctx) => {
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

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  fullName: z.string().trim().min(1).max(100),
  password: passwordSchema,
  roleId: z.string().uuid(),
});

export const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(1).max(100).optional(),
    roleId: z.string().uuid().optional(),
    password: passwordSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1).max(100).optional(),
    password: passwordSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});
