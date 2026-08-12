import { Document } from "../../domain/entities/Document.js";
import type { ListQuery, Paginated } from "./ListQuery.js";

export interface ListDocumentsParams extends ListQuery {
  sortBy: "displayName" | "createdAt";
  scope?: "all" | "assigned";
  roleIds?: string[];
}

export interface CreateDocumentInput {
  displayName: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  categoryId: string;
  uploadedById: string;
  roleIds: string[];
  assignAllRoles: boolean;
}

export interface DownloadableFile {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storedName: string;
}

export interface UpdateDocumentInput {
  displayName?: string;
  categoryId?: string;
  roleIds?: string[];
  assignAllRoles?: boolean;
}

export interface DocumentRepository {
  list(params: ListDocumentsParams): Promise<Paginated<Document>>;
  create(input: CreateDocumentInput): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findForDownload(id: string): Promise<DownloadableFile | null>;
  update(id: string, input: UpdateDocumentInput): Promise<Document>;
  softDelete(id: string): Promise<void>;
}
