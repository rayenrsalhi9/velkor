import type { Request, Response } from "express";
import type { CreateSurvey } from "../../application/use-cases/CreateSurvey.js";
import type { ListSurveys } from "../../application/use-cases/ListSurveys.js";
import type { ListPendingSurveys } from "../../application/use-cases/ListPendingSurveys.js";
import type { GetSurveyAnalytics } from "../../application/use-cases/GetSurveyAnalytics.js";
import type { SubmitSurveyResponse } from "../../application/use-cases/SubmitSurveyResponse.js";
import type { CloseSurvey } from "../../application/use-cases/CloseSurvey.js";
import type { SoftDeleteSurvey } from "../../application/use-cases/SoftDeleteSurvey.js";
import type { RoleRepository } from "../../application/ports/RoleRepository.js";
import { SurveyNotFoundError } from "../../application/errors/SurveyNotFoundError.js";
import { SurveyClosedError } from "../../application/errors/SurveyClosedError.js";
import { SurveyAlreadyAnsweredError } from "../../application/errors/SurveyAlreadyAnsweredError.js";
import { NotSurveyCreatorError } from "../../application/errors/NotSurveyCreatorError.js";
import { InvalidRoleAssignmentError } from "../../application/errors/InvalidRoleAssignmentError.js";
import {
  createSurveySchema,
  surveysListQuerySchema,
  submitResponseSchema,
} from "./schemas/surveySchema.js";
import { idParamSchema } from "./schemas/shared.js";

export function makeCreateSurveyHandler(createSurvey: CreateSurvey) {
  return async (req: Request, res: Response) => {
    const parsed = createSurveySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const survey = await createSurvey.execute(
        {
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          type: parsed.data.type,
          roleIds: parsed.data.roleIds,
          assignAllRoles: parsed.data.assignAllRoles,
        },
        req.currentUser!.userId,
      );
      return res.status(201).json(survey);
    } catch (err) {
      if (err instanceof InvalidRoleAssignmentError) {
        return res.status(400).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeListSurveysHandler(
  listSurveys: ListSurveys,
  roleRepository: RoleRepository,
) {
  return async (req: Request, res: Response) => {
    const parsed = surveysListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query" });
    }

    try {
      const role = await roleRepository.findByName(req.currentUser!.role);
      const roleIds = role ? [role.id] : [];
      return res.json(await listSurveys.execute({ ...parsed.data, roleIds }));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeListPendingSurveysHandler(
  listPendingSurveys: ListPendingSurveys,
  roleRepository: RoleRepository,
) {
  return async (req: Request, res: Response) => {
    try {
      const role = await roleRepository.findByName(req.currentUser!.role);
      const roleIds = role ? [role.id] : [];
      const surveys = await listPendingSurveys.execute(
        req.currentUser!.userId,
        roleIds,
      );
      return res.json({ items: surveys, total: surveys.length });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeGetSurveyAnalyticsHandler(
  getSurveyAnalytics: GetSurveyAnalytics,
) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const analytics = await getSurveyAnalytics.execute(params.data.id);
      return res.json(analytics);
    } catch (err) {
      if (err instanceof SurveyNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeSubmitSurveyResponseHandler(
  submitSurveyResponse: SubmitSurveyResponse,
  roleRepository: RoleRepository,
) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    const parsed = submitResponseSchema.safeParse(req.body);
    if (!params.success || !parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const role = await roleRepository.findByName(req.currentUser!.role);
      const userRoleIds = role ? [role.id] : [];
      await submitSurveyResponse.execute(
        params.data.id,
        req.currentUser!.userId,
        { value: parsed.data.value },
        userRoleIds,
      );
      return res.status(201).json({ message: "Response recorded" });
    } catch (err) {
      if (err instanceof SurveyNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof SurveyClosedError) {
        return res.status(400).json({ error: err.message });
      }
      if (err instanceof SurveyAlreadyAnsweredError) {
        return res.status(409).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeCloseSurveyHandler(closeSurvey: CloseSurvey) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const isAdmin = req.currentUser!.claims.includes("*");
      await closeSurvey.execute(
        params.data.id,
        req.currentUser!.userId,
        isAdmin,
      );
      return res.status(204).send();
    } catch (err) {
      if (err instanceof SurveyNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof NotSurveyCreatorError) {
        return res.status(403).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeDeleteSurveyHandler(softDeleteSurvey: SoftDeleteSurvey) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const isAdmin = req.currentUser!.claims.includes("*");
      await softDeleteSurvey.execute(
        params.data.id,
        req.currentUser!.userId,
        isAdmin,
      );
      return res.status(204).send();
    } catch (err) {
      if (err instanceof SurveyNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof NotSurveyCreatorError) {
        return res.status(403).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
