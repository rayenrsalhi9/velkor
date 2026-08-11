import { Document } from "../../domain/entities/Document.js";
import type { ListQuery, Paginated } from "./ListQuery.js";

export interface ListDocumentsParams extends ListQuery {
  sortBy: "displayName" | "createdAt";
}

export interface DocumentRepository {
  list(params: ListDocumentsParams): Promise<Paginated<Document>>;
}