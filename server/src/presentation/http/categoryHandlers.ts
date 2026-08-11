import type { Request, Response } from "express";
import type { CreateCategory } from "../../application/use-cases/CreateCategory.js";
import type { UpdateCategory } from "../../application/use-cases/UpdateCategory.js";
import type { DeleteCategory } from "../../application/use-cases/DeleteCategory.js";
import type { ListCategories } from "../../application/use-cases/ListCategories.js";
import { CategoryNotFoundError } from "../../application/errors/CategoryNotFoundError.js";
import { CategoryNameConflictError } from "../../application/errors/CategoryNameConflictError.js";
import { CategoryInUseError } from "../../application/errors/CategoryInUseError.js";
import {
  createCategorySchema,
  updateCategorySchema,
  categoriesListQuerySchema,
} from "./schemas/categorySchema.js";
import { idParamSchema } from "./schemas/shared.js";

export function makeListCategoriesHandler(listCategories: ListCategories) {
  return async (req: Request, res: Response) => {
    const parsed = categoriesListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query" });
    }

    try {
      return res.json(await listCategories.execute(parsed.data));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeCreateCategoryHandler(createCategory: CreateCategory) {
  return async (req: Request, res: Response) => {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const category = await createCategory.execute({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      });
      return res.status(201).json(category);
    } catch (err) {
      if (err instanceof CategoryNameConflictError) {
        return res.status(409).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeUpdateCategoryHandler(updateCategory: UpdateCategory) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!params.success || !parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const category = await updateCategory.execute(params.data.id, {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description,
        }),
      });
      return res.json(category);
    } catch (err) {
      if (err instanceof CategoryNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof CategoryNameConflictError) {
        return res.status(409).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeDeleteCategoryHandler(deleteCategory: DeleteCategory) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      await deleteCategory.execute(params.data.id);
      return res.status(204).send();
    } catch (err) {
      if (err instanceof CategoryNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof CategoryInUseError) {
        return res.status(409).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}