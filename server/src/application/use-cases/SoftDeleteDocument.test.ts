import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SoftDeleteDocument } from "./SoftDeleteDocument.js";
import { Document } from "../../domain/entities/Document.js";
import { DocumentNotFoundError } from "../errors/DocumentNotFoundError.js";
import type { DocumentRepository } from "../ports/DocumentRepository.js";

describe("SoftDeleteDocument", () => {
  it("soft deletes through the repository", async () => {
    const deleted: string[] = [];
    const documentRepository: DocumentRepository = {
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
        deleted.push(id);
      },
    };
    const useCase = new SoftDeleteDocument(documentRepository);
    await useCase.execute("d1");
    assert.deepEqual(deleted, ["d1"]);
  });

  it("propagates DocumentNotFoundError from the repository", async () => {
    const documentRepository: DocumentRepository = {
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
      async softDelete() {
        throw new DocumentNotFoundError();
      },
    };
    const useCase = new SoftDeleteDocument(documentRepository);
    await assert.rejects(useCase.execute("missing"), DocumentNotFoundError);
  });
});
