import type { Request, Response } from "express";
import type { ListRoles } from "../../application/use-cases/ListRoles.js";
import type { CreateRole } from "../../application/use-cases/CreateRole.js";
import type { UpdateRole } from "../../application/use-cases/UpdateRole.js";
import type { DeleteRole } from "../../application/use-cases/DeleteRole.js";
import { RoleNotFoundError } from "../../application/errors/RoleNotFoundError.js";
import { RoleNameConflictError } from "../../application/errors/RoleNameConflictError.js";
import { RoleInUseError } from "../../application/errors/RoleInUseError.js";
import { InvalidClaimsError } from "../../application/errors/InvalidClaimsError.js";
import { CLAIMS_CATALOG } from "../../application/claims/claimsCatalog.js";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdParamSchema,
} from "./schemas/roleSchema.js";

export function makeListClaimsHandler() {
  return (_req: Request, res: Response) => {
    return res.json(CLAIMS_CATALOG);
  };
}

export function makeListRolesHandler(listRoles: ListRoles) {
  return async (_req: Request, res: Response) => {
    try {
      return res.json(await listRoles.execute());
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeCreateRoleHandler(createRole: CreateRole) {
  return async (req: Request, res: Response) => {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const role = await createRole.execute({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        claims: parsed.data.claims,
      });
      return res.status(201).json(role);
    } catch (err) {
      if (err instanceof RoleNameConflictError) {
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof InvalidClaimsError) {
        return res.status(400).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeUpdateRoleHandler(updateRole: UpdateRole) {
  return async (req: Request, res: Response) => {
    const params = roleIdParamSchema.safeParse(req.params);
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!params.success || !parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const role = await updateRole.execute(params.data.id, {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description,
        }),
        ...(parsed.data.claims !== undefined && { claims: parsed.data.claims }),
      });
      return res.json(role);
    } catch (err) {
      if (err instanceof RoleNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof RoleNameConflictError) {
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof InvalidClaimsError) {
        return res.status(400).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeDeleteRoleHandler(deleteRole: DeleteRole) {
  return async (req: Request, res: Response) => {
    const params = roleIdParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      await deleteRole.execute(params.data.id);
      return res.status(204).send();
    } catch (err) {
      if (err instanceof RoleNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof RoleInUseError) {
        return res.status(409).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
