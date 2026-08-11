import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import type { ListDocuments } from "../../application/use-cases/ListDocuments.js";
import type { UploadDocument } from "../../application/use-cases/UploadDocument.js";
import { UnsupportedFileTypeError } from "../../application/errors/UnsupportedFileTypeError.js";
import { FileTooLargeError } from "../../application/errors/FileTooLargeError.js";
import { CategoryNotFoundError } from "../../application/errors/CategoryNotFoundError.js";
import { InvalidRoleAssignmentError } from "../../application/errors/InvalidRoleAssignmentError.js";
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

export function makeUploadDocumentHandler(uploadDocument: UploadDocument) {
  const rawMax = process.env.MAX_UPLOAD_BYTES ?? String(10 * 1024 * 1024);
  const maxUploadBytes = Number(rawMax);
  if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes <= 0) {
    throw new Error(`Invalid MAX_UPLOAD_BYTES: ${rawMax}`);
  }
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxUploadBytes,
    },
  }).single("file");

  return async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: new FileTooLargeError().message });
        }
        return res.status(400).json({ error: "Invalid upload" });
      }

      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const roleIds =
        typeof req.body.roleIds === "string"
          ? [req.body.roleIds]
          : (Array.isArray(req.body.roleIds) ? req.body.roleIds : []);
      const assignAllRoles = req.body.assignAllRoles === "true";

      try {
        const document = await uploadDocument.execute(
          {
            originalName: file.originalname,
            mimeType: file.mimetype,
            buffer: file.buffer,
          },
          {
            displayName: req.body.displayName,
            categoryId: req.body.categoryId,
            roleIds,
            assignAllRoles,
          },
          req.currentUser!.userId,
        );
        return res.status(201).json(document);
      } catch (err) {
        if (err instanceof UnsupportedFileTypeError) {
          return res.status(400).json({ error: err.message });
        }
        if (err instanceof CategoryNotFoundError) {
          return res.status(404).json({ error: err.message });
        }
        if (err instanceof InvalidRoleAssignmentError) {
          return res.status(400).json({ error: err.message });
        }
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  };
}