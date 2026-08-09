import type { Request, Response } from "express";
import type { ListUsers } from "../../application/use-cases/ListUsers.js";
import type { CreateUser } from "../../application/use-cases/CreateUser.js";
import type { UpdateUser } from "../../application/use-cases/UpdateUser.js";
import type { DeleteUser } from "../../application/use-cases/DeleteUser.js";
import { UserNotFoundError } from "../../application/errors/UserNotFoundError.js";
import { RoleNotFoundError } from "../../application/errors/RoleNotFoundError.js";
import { EmailConflictError } from "../../application/errors/EmailConflictError.js";
import { SelfDeletionError } from "../../application/errors/SelfDeletionError.js";
import { createUserSchema, updateUserSchema } from "./schemas/userSchema.js";
import { idParamSchema } from "./schemas/shared.js";

export function makeListUsersHandler(listUsers: ListUsers) {
  return async (_req: Request, res: Response) => {
    try {
      return res.json(await listUsers.execute());
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeCreateUserHandler(createUser: CreateUser) {
  return async (req: Request, res: Response) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const user = await createUser.execute(parsed.data);
      return res.status(201).json(user);
    } catch (err) {
      if (err instanceof EmailConflictError) {
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof RoleNotFoundError) {
        return res.status(400).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeUpdateUserHandler(updateUser: UpdateUser) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    const parsed = updateUserSchema.safeParse(req.body);
    if (!params.success || !parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const user = await updateUser.execute(params.data.id, {
        ...(parsed.data.fullName !== undefined && {
          fullName: parsed.data.fullName,
        }),
        ...(parsed.data.roleId !== undefined && { roleId: parsed.data.roleId }),
        ...(parsed.data.password !== undefined && {
          password: parsed.data.password,
        }),
      });
      return res.json(user);
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof RoleNotFoundError) {
        return res.status(400).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeDeleteUserHandler(deleteUser: DeleteUser) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      await deleteUser.execute(params.data.id, req.userId!);
      return res.status(204).send();
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof SelfDeletionError) {
        return res.status(400).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
