import { Document } from "../../domain/entities/Document.js";
import type { ListQuery, Paginated } from "./ListQuery.js";

export interface ListDocumentsParams extends ListQuery {
  sortBy: "displayName" | "createdAt";
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

export interface DocumentRepository {
  list(params: ListDocumentsParams): Promise<Paginated<Document>>;
  create(input: CreateDocumentInput): Promise<Document>;
  findById(id: string): Promise<Document | null>;
}