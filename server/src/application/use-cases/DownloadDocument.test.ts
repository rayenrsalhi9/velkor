import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { DownloadDocument } from "./DownloadDocument.js";
import { Document } from "../../domain/entities/Document.js";
import { DocumentNotFoundError } from "../errors/DocumentNotFoundError.js";
import type { DocumentRepository } from "../ports/DocumentRepository.js";
import type { FileStorage } from "../ports/FileStorage.js";

function makeRepository(
  file: { id: string } | null,
  calls: { roleIds: string[] | undefined } = { roleIds: undefined },
) {
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
        input.assignAllRoles,
        input.roleIds,
      );
    },
    async findById(id) {
      return file?.id === id
        ? new Document(
            id,
            "x",
            "x.pdf",
            "application/pdf",
            1,
            "c1",
            "Policies",
            "Admin User",
          )
        : null;
    },
    async findForDownload(id, roleIds) {
      calls.roleIds = roleIds;
      return file?.id === id
        ? {
            fileName: "report.pdf",
            mimeType: "application/pdf",
            sizeBytes: 10,
            storedName: "stored-report.pdf",
          }
        : null;
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
      return null;
    },
  };
  return documentRepository;
}

function makeStorage() {
  const fileStorage: FileStorage = {
    async save(bytes, originalName) {
      return { storedName: `stored-${originalName}`, sizeBytes: bytes.length };
    },
    async read() {
      return Readable.from(["bytes"]);
    },
    async remove() {},
  };
  return fileStorage;
}

describe("DownloadDocument", () => {
  it("returns file metadata and a stream from storage", async () => {
    const useCase = new DownloadDocument(
      makeRepository({ id: "d1" }),
      makeStorage(),
    );
    const result = await useCase.execute("d1");
    assert.equal(result.fileName, "report.pdf");
    assert.equal(result.mimeType, "application/pdf");
    assert.equal(result.sizeBytes, 10);
    assert.ok(result.stream instanceof Readable);
  });

  it("throws DocumentNotFoundError for a missing document", async () => {
    const useCase = new DownloadDocument(makeRepository(null), makeStorage());
    await assert.rejects(useCase.execute("missing"), DocumentNotFoundError);
  });

  it("forwards roleIds to the repository for role-scoped access", async () => {
    const calls: { roleIds: string[] | undefined } = { roleIds: undefined };
    const useCase = new DownloadDocument(
      makeRepository({ id: "d1" }, calls),
      makeStorage(),
    );
    await useCase.execute("d1", ["r1"]);
    assert.deepEqual(calls.roleIds, ["r1"]);
  });

  it("leaves the repository unscoped when no roleIds are provided", async () => {
    const calls: { roleIds: string[] | undefined } = { roleIds: undefined };
    const useCase = new DownloadDocument(
      makeRepository({ id: "d1" }, calls),
      makeStorage(),
    );
    await useCase.execute("d1");
    assert.equal(calls.roleIds, undefined);
  });
});
