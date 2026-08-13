import path from "node:path";
import type { DocumentRepository } from "../ports/DocumentRepository.js";
import type { CategoryRepository } from "../ports/CategoryRepository.js";
import type { RoleRepository } from "../ports/RoleRepository.js";
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

// ponytail: checks the OPC package marker ([Content_Types].xml as the first
// archive entry, per ECMA-376); does not distinguish docx from xlsx/pptx.
function isOoxmlPackage(b: Buffer): boolean {
  if (b.length < 4 || b.subarray(0, 4).toString("latin1") !== "PK\x03\x04") {
    return false;
  }
  if (b.length < 30) {
    return false;
  }
  const nameLen = b.readUInt16LE(26);
  const extraLen = b.readUInt16LE(28);
  if (b.length < 30 + nameLen + extraLen) {
    return false;
  }
  return b.subarray(30, 30 + nameLen).toString("latin1") === "[Content_Types].xml";
}

function sniffMagicBytes(buffer: Buffer, extension: string): boolean {
  const b = buffer;
  switch (extension) {
    case "pdf":
      return b.subarray(0, 5).toString("latin1") === "%PDF-";
    case "png":
      return (
        b.length >= 8 &&
        b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      );
    case "jpg":
    case "jpeg":
      return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "gif":
      return b.subarray(0, 4).toString("latin1") === "GIF8";
    case "webp":
      return (
        b.length >= 12 &&
        b.subarray(0, 4).toString("latin1") === "RIFF" &&
        b.subarray(8, 12).toString("latin1") === "WEBP"
      );
    case "docx":
    case "xlsx":
    case "pptx":
      return isOoxmlPackage(b);
    default:
      return true;
  }
}

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
    private roleRepository: RoleRepository,
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
    if (!sniffMagicBytes(file.buffer, extension)) {
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
    if (input.roleIds.length > 0) {
      const existing = await this.roleRepository.countByIds(input.roleIds);
      if (existing !== input.roleIds.length) {
        throw new InvalidRoleAssignmentError(
          "One or more assigned roles do not exist",
        );
      }
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