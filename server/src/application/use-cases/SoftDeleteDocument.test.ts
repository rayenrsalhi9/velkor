import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SoftDeleteDocument } from "./SoftDeleteDocument.js";
import { Document } from "../../domain/entities/Document.js";
import { DocumentNotFoundError } from "../errors/DocumentNotFoundError.js";
import type { DocumentRepository } from "../ports/DocumentRepository.js";
import type { FileStorage } from "../ports/FileStorage.js";

function makeRepository(softDelete: DocumentRepository["softDelete"]): DocumentRepository {
  return {
    async list() {
      return { items: [], total: 0 };
    },
    async create(input) {
      return new Document(
        "d1",
        input.displayName,
        input.fileName,
        input.mimeType,
        input.sizeBytes,
        input.categoryId,
        "Policies",
        "Admin User",
      );
    },
    async findById() {
      return null;
    },
    async findForDownload() {
      return null;
    },
    async update(id, input) {
      return new Document(
        id,
        input.displayName ?? "x",
        "x.pdf",
        "application/pdf",
        1,
        "c1",
        "Policies",
        "Admin User",
      );
    },
    async softDelete(id) {
      return softDelete(id);
    },
  };
}

describe("SoftDeleteDocument", () => {
  it("removes the physical file after soft deleting", async () => {
    const deleted: string[] = [];
    const removed: string[] = [];
    const documentRepository = makeRepository(async (id) => {
      deleted.push(id);
      return "stored-1.pdf";
    });
    const fileStorage: FileStorage = {
      async save() {
        throw new Error("not used");
      },
      async read() {
        throw new Error("not used");
      },
      async remove(storedName) {
        removed.push(storedName);
      },
    };
    const useCase = new SoftDeleteDocument(documentRepository, fileStorage);
    await useCase.execute("d1");
    assert.deepEqual(deleted, ["d1"]);
    assert.deepEqual(removed, ["stored-1.pdf"]);
  });

  it("propagates DocumentNotFoundError from the repository", async () => {
    const documentRepository = makeRepository(async () => {
      throw new DocumentNotFoundError();
    });
    const fileStorage: FileStorage = {
      async save() {
        throw new Error("not used");
      },
      async read() {
        throw new Error("not used");
      },
      async remove() {
        throw new Error("not used");
      },
    };
    const useCase = new SoftDeleteDocument(documentRepository, fileStorage);
    await assert.rejects(useCase.execute("missing"), DocumentNotFoundError);
  });
});