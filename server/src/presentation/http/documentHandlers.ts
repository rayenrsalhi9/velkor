import type { Request, Response } from "express";
import type { ListDocuments } from "../../application/use-cases/ListDocuments.js";
import { documentsListQuerySchema } from "./schemas/documentSchema.js";

export function makeListDocumentsHandler(listDocuments: ListDocuments) {
  return async (req: Request, res: Response) => {
    const parsed = documentsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query" });
    }

    try {
      return res.json(await listDocuments.execute(parsed.data));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}