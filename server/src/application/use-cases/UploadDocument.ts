import path from "node:path";
import type { DocumentRepository } from "../ports/DocumentRepository.js";
import type { CategoryRepository } from "../ports/CategoryRepository.js";
import type { FileStorage } from "../ports/FileStorage.js";
import type { Document } from "../../domain/entities/Document.js";
import { UnsupportedFileTypeError } from "../errors/UnsupportedFileTypeError.js";
import { CategoryNotFoundError } from "../errors/CategoryNotFoundError.js";
import { InvalidRoleAssignmentError } from "../errors/InvalidRoleAssignmentError.js";

export const ALLOWED_EXTENSIONS = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "docx",
  "xlsx",
  "pptx",
  "txt",
  "csv",
];

export interface UploadFile {
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface UploadDocumentInput {
  displayName?: string;
  categoryId: string;
  roleIds: string[];
  assignAllRoles: boolean;
}

export class UploadDocument {
  constructor(
    private documentRepository: DocumentRepository,
    private categoryRepository: CategoryRepository,
    private fileStorage: FileStorage,
  ) {}

  async execute(
    file: UploadFile,
    input: UploadDocumentInput,
    userId: string,
  ): Promise<Document> {
    const extension = path
      .extname(file.originalName)
      .slice(1)
      .toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new UnsupportedFileTypeError();
    }
    if (input.roleIds.length === 0 && !input.assignAllRoles) {
      throw new InvalidRoleAssignmentError(
        "At least one role must be assigned",
      );
    }
    if (input.roleIds.length > 0 && input.assignAllRoles) {
      throw new InvalidRoleAssignmentError(
        "Either pick roles or assign to all, not both",
      );
    }
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    const saved = await this.fileStorage.save(file.buffer, file.originalName);
    try {
      const displayName =
        input.displayName?.trim() || this.defaultName(file.originalName);
      return await this.documentRepository.create({
        displayName,
        fileName: file.originalName,
        storedName: saved.storedName,
        mimeType: file.mimeType,
        sizeBytes: saved.sizeBytes,
        categoryId: input.categoryId,
        uploadedById: userId,
        roleIds: input.roleIds,
        assignAllRoles: input.assignAllRoles,
      });
    } catch (err) {
      try {
        await this.fileStorage.remove(saved.storedName);
      } catch (cleanupErr) {
        console.error("Failed to clean up staged file", cleanupErr);
      }
      throw err;
    }
  }

  private defaultName(originalName: string): string {
    const base = path.basename(originalName, path.extname(originalName));
    return base.trim() || "Untitled document";
  }
}