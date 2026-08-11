import type { DocumentRepository, ListDocumentsParams } from "../ports/DocumentRepository.js";
import type { Paginated } from "../ports/ListQuery.js";
import type { Document } from "../../domain/entities/Document.js";

export class ListDocuments {
  constructor(private documentRepository: DocumentRepository) {}

  async execute(params: ListDocumentsParams): Promise<Paginated<Document>> {
    return this.documentRepository.list(params);
  }
}