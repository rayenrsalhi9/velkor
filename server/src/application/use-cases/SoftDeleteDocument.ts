import type { DocumentRepository } from "../ports/DocumentRepository.js";
import type { FileStorage } from "../ports/FileStorage.js";

export class SoftDeleteDocument {
  constructor(
    private documentRepository: DocumentRepository,
    private fileStorage: FileStorage,
  ) {}

  async execute(id: string): Promise<void> {
    const storedName = await this.documentRepository.softDelete(id);
    if (storedName) {
      await this.fileStorage.remove(storedName);
    }
  }
}