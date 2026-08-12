import type { Readable } from "node:stream";
import type { DocumentRepository } from "../ports/DocumentRepository.js";
import type { FileStorage } from "../ports/FileStorage.js";
import { DocumentNotFoundError } from "../errors/DocumentNotFoundError.js";

export interface DownloadableFile {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  stream: Readable;
}

export class DownloadDocument {
  constructor(
    private documentRepository: DocumentRepository,
    private fileStorage: FileStorage,
  ) {}

  async execute(id: string): Promise<DownloadableFile> {
    const file = await this.documentRepository.findForDownload(id);
    if (!file) {
      throw new DocumentNotFoundError();
    }
    const stream = await this.fileStorage.read(file.storedName);
    return {
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      stream,
    };
  }
}
