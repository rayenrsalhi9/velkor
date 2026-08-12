import type { DocumentRepository } from "../ports/DocumentRepository.js";

export class SoftDeleteDocument {
  constructor(private documentRepository: DocumentRepository) {}

  async execute(id: string): Promise<void> {
    await this.documentRepository.softDelete(id);
  }
}
