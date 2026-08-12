import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import type { ListDocuments } from "../../application/use-cases/ListDocuments.js";
import type { UploadDocument } from "../../application/use-cases/UploadDocument.js";
import type { DownloadDocument } from "../../application/use-cases/DownloadDocument.js";
import type { SoftDeleteDocument } from "../../application/use-cases/SoftDeleteDocument.js";
import type { UpdateDocument } from "../../application/use-cases/UpdateDocument.js";
import type { RoleRepository } from "../../application/ports/RoleRepository.js";
import { UnsupportedFileTypeError } from "../../application/errors/UnsupportedFileTypeError.js";
import { FileTooLargeError } from "../../application/errors/FileTooLargeError.js";
import { CategoryNotFoundError } from "../../application/errors/CategoryNotFoundError.js";
import { InvalidRoleAssignmentError } from "../../application/errors/InvalidRoleAssignmentError.js";
import { DocumentNotFoundError } from "../../application/errors/DocumentNotFoundError.js";
import {
  documentsListQuerySchema,
  updateDocumentSchema,
} from "./schemas/documentSchema.js";
import { idParamSchema } from "./schemas/shared.js";

export function makeListDocumentsHandler(
  listDocuments: ListDocuments,
  roleRepository: RoleRepository,
) {
  return async (req: Request, res: Response) => {
    const parsed = documentsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query" });
    }

    try {
      let roleIds: string[] | undefined;
      if (parsed.data.scope === "assigned") {
        const role = await roleRepository.findByName(req.currentUser!.role);
        roleIds = role ? [role.id] : [];
      }
      return res.json(
        await listDocuments.execute({
          ...parsed.data,
          ...(roleIds !== undefined && { roleIds }),
        }),
      );
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
        if (
          err instanceof multer.MulterError &&
          err.code === "LIMIT_FILE_SIZE"
        ) {
          return res
            .status(400)
            .json({ error: new FileTooLargeError().message });
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
          : Array.isArray(req.body.roleIds)
            ? req.body.roleIds
            : [];
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

export function makeDownloadDocumentHandler(
  downloadDocument: DownloadDocument,
) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const file = await downloadDocument.execute(params.data.id);
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Length", String(file.sizeBytes));
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      );
      file.stream.pipe(res);
    } catch (err) {
      if (err instanceof DocumentNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeSoftDeleteDocumentHandler(
  softDeleteDocument: SoftDeleteDocument,
) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      await softDeleteDocument.execute(params.data.id);
      return res.status(204).send();
    } catch (err) {
      if (err instanceof DocumentNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function makeUpdateDocumentHandler(updateDocument: UpdateDocument) {
  return async (req: Request, res: Response) => {
    const params = idParamSchema.safeParse(req.params);
    const parsed = updateDocumentSchema.safeParse(req.body);
    if (!params.success || !parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const document = await updateDocument.execute(params.data.id, {
        ...(parsed.data.displayName !== undefined && {
          displayName: parsed.data.displayName,
        }),
        ...(parsed.data.categoryId !== undefined && {
          categoryId: parsed.data.categoryId,
        }),
        ...(parsed.data.roleIds !== undefined && {
          roleIds: parsed.data.roleIds,
        }),
        ...(parsed.data.assignAllRoles !== undefined && {
          assignAllRoles: parsed.data.assignAllRoles,
        }),
      });
      return res.json(document);
    } catch (err) {
      if (err instanceof DocumentNotFoundError) {
        return res.status(404).json({ error: err.message });
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
  };
}
