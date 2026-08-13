import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UploadDocument } from "./UploadDocument.js";
import { Document } from "../../domain/entities/Document.js";
import { Category } from "../../domain/entities/Category.js";
import { UnsupportedFileTypeError } from "../errors/UnsupportedFileTypeError.js";
import { CategoryNotFoundError } from "../errors/CategoryNotFoundError.js";
import { InvalidRoleAssignmentError } from "../errors/InvalidRoleAssignmentError.js";
import type { DocumentRepository } from "../ports/DocumentRepository.js";
import type { CategoryRepository } from "../ports/CategoryRepository.js";
import type { RoleRepository } from "../ports/RoleRepository.js";
import type { FileStorage } from "../ports/FileStorage.js";

// Builds a ZIP whose first local-file-header entry is [Content_Types].xml,
// shaped like a real OOXML package.
function makeOoxmlBuffer(): Buffer {
  return Buffer.concat([
    Buffer.from("PK\x03\x04"),
    Buffer.alloc(22),
    Buffer.from([19, 0, 0, 0]),
    Buffer.from("[Content_Types].xml"),
  ]);
}

// Builds a generic ZIP whose first entry is a plain file.
function makeZipBuffer(firstEntryName: string): Buffer {
  return Buffer.concat([
    Buffer.from("PK\x03\x04"),
    Buffer.alloc(22),
    Buffer.from([firstEntryName.length, 0, 0, 0]),
    Buffer.from(firstEntryName),
  ]);
}

function makeDeps() {
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
      return id === "missing"
        ? null
        : new Document(
            "d1",
            "x",
            "x.pdf",
            "application/pdf",
            1,
            "c1",
            "Policies",
            "Admin User",
          );
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
        input.categoryId ?? "c1",
        "Policies",
        "Admin User",
      );
    },
    async softDelete() {
      return null;
    },
  };
  const categoryRepository: CategoryRepository = {
    async list() {
      return { items: [], total: 0 };
    },
    async findById(id) {
      return id === "c1" ? new Category("c1", "Policies", null) : null;
    },
    async findByName() {
      return null;
    },
    async create(input) {
      return new Category("c1", input.name, input.description);
    },
    async update() {
      return new Category("c1", "x", null);
    },
    async delete() {},
    async countDocuments() {
      return 0;
    },
  };
  const fileStorage: FileStorage = {
    async save(bytes, originalName) {
      return { storedName: `stored-${originalName}`, sizeBytes: bytes.length };
    },
    async read() {
      throw new Error("not implemented");
    },
    async remove() {},
  };
  const roleRepository: RoleRepository = {
    async list() {
      return { items: [], total: 0 };
    },
    async findById() {
      return null;
    },
    async findByName() {
      return null;
    },
    async create() {
      throw new Error("not used");
    },
    async update() {
      throw new Error("not used");
    },
    async delete() {},
    async countUsers() {
      return 0;
    },
    async countByIds(ids) {
      return ids.length;
    },
  };
  return { documentRepository, categoryRepository, roleRepository, fileStorage };
}

describe("UploadDocument", () => {
  it("creates a document with roles", async () => {
    const { documentRepository, categoryRepository, roleRepository, fileStorage } = makeDeps();
    const useCase = new UploadDocument(
      documentRepository,
      categoryRepository,

      roleRepository,
      fileStorage,
    );
    const result = await useCase.execute(
      {
        originalName: "report.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n"),
      },
      { categoryId: "c1", roleIds: ["r1", "r2"], assignAllRoles: false },
      "u1",
    );
    assert.equal(result.displayName, "report");
    assert.deepEqual(result.roleIds, ["r1", "r2"]);
  });

  it("defaults display name to the file name", async () => {
    const { documentRepository, categoryRepository, roleRepository, fileStorage } = makeDeps();
    const useCase = new UploadDocument(
      documentRepository,
      categoryRepository,

      roleRepository,
      fileStorage,
    );
    const result = await useCase.execute(
      {
        originalName: "Quarterly results.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: makeOoxmlBuffer(),
      },
      { categoryId: "c1", roleIds: ["r1"], assignAllRoles: false },
      "u1",
    );
    assert.equal(result.displayName, "Quarterly results");
    assert.equal(result.fileName, "Quarterly results.xlsx");
  });

  it("rejects a generic ZIP renamed with an Office extension", async () => {
    const { documentRepository, categoryRepository, roleRepository, fileStorage } = makeDeps();
    const useCase = new UploadDocument(
      documentRepository,
      categoryRepository,

      roleRepository,
      fileStorage,
    );
    await assert.rejects(
      useCase.execute(
        {
          originalName: "archive.docx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          buffer: makeZipBuffer("hello.txt"),
        },
        { categoryId: "c1", roleIds: ["r1"], assignAllRoles: false },
        "u1",
      ),
      UnsupportedFileTypeError,
    );
  });

  it("rejects an unsupported extension", async () => {
    const { documentRepository, categoryRepository, roleRepository, fileStorage } = makeDeps();
    const useCase = new UploadDocument(
      documentRepository,
      categoryRepository,

      roleRepository,
      fileStorage,
    );
    await assert.rejects(
      useCase.execute(
        {
          originalName: "malware.exe",
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("%PDF-1.4\n"),
        },
        { categoryId: "c1", roleIds: ["r1"], assignAllRoles: false },
        "u1",
      ),
      UnsupportedFileTypeError,
    );
  });

  it("rejects no roles when not assigning to all", async () => {
    const { documentRepository, categoryRepository, roleRepository, fileStorage } = makeDeps();
    const useCase = new UploadDocument(
      documentRepository,
      categoryRepository,

      roleRepository,
      fileStorage,
    );
    await assert.rejects(
      useCase.execute(
        {
          originalName: "report.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n"),
        },
        { categoryId: "c1", roleIds: [], assignAllRoles: false },
        "u1",
      ),
      InvalidRoleAssignmentError,
    );
  });

  it("rejects both roles and assignAllRoles", async () => {
    const { documentRepository, categoryRepository, roleRepository, fileStorage } = makeDeps();
    const useCase = new UploadDocument(
      documentRepository,
      categoryRepository,

      roleRepository,
      fileStorage,
    );
    await assert.rejects(
      useCase.execute(
        {
          originalName: "report.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n"),
        },
        { categoryId: "c1", roleIds: ["r1"], assignAllRoles: true },
        "u1",
      ),
      InvalidRoleAssignmentError,
    );
  });

  it("rejects a missing category", async () => {
    const { documentRepository, categoryRepository, roleRepository, fileStorage } = makeDeps();
    const useCase = new UploadDocument(
      documentRepository,
      categoryRepository,

      roleRepository,
      fileStorage,
    );
    await assert.rejects(
      useCase.execute(
        {
          originalName: "report.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n"),
        },
        { categoryId: "nope", roleIds: ["r1"], assignAllRoles: false },
        "u1",
      ),
      CategoryNotFoundError,
    );
  });

  it("removes the saved file when the row fails to create", async () => {
    const { categoryRepository, roleRepository, fileStorage } = makeDeps();
    const removed: string[] = [];
    const failingRepository: DocumentRepository = {
      ...makeDeps().documentRepository,
      async create() {
        throw new Error("db down");
      },
    };
    const trackingStorage: FileStorage = {
      ...fileStorage,
      async remove(storedName) {
        removed.push(storedName);
      },
    };
    const useCase = new UploadDocument(
      failingRepository,
      categoryRepository,

      roleRepository,
      trackingStorage,
    );
    await assert.rejects(
      useCase.execute(
        {
          originalName: "report.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n"),
        },
        { categoryId: "c1", roleIds: ["r1"], assignAllRoles: false },
        "u1",
      ),
    );
    assert.deepEqual(removed, ["stored-report.pdf"]);
  });

  it("does not mask the original error when cleanup fails", async () => {
    const { categoryRepository, roleRepository, fileStorage } = makeDeps();
    const failingRepository: DocumentRepository = {
      ...makeDeps().documentRepository,
      async create() {
        throw new Error("db down");
      },
    };
    const failingStorage: FileStorage = {
      ...fileStorage,
      async remove() {
        throw new Error("disk gone");
      },
    };
    const useCase = new UploadDocument(
      failingRepository,
      categoryRepository,

      roleRepository,
      failingStorage,
    );
    await assert.rejects(
      useCase.execute(
        {
          originalName: "report.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n"),
        },
        { categoryId: "c1", roleIds: ["r1"], assignAllRoles: false },
        "u1",
      ),
      (err: unknown) => err instanceof Error && err.message === "db down",
    );
  });

  it("rejects a file whose bytes do not match its extension", async () => {
    const { documentRepository, categoryRepository, roleRepository, fileStorage } = makeDeps();
    const useCase = new UploadDocument(
      documentRepository,
      categoryRepository,
      roleRepository,
      fileStorage,
    );
    await assert.rejects(
      useCase.execute(
        {
          originalName: "report.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("not a pdf at all"),
        },
        { categoryId: "c1", roleIds: ["r1"], assignAllRoles: false },
        "u1",
      ),
      UnsupportedFileTypeError,
    );
  });

  it("rejects role ids that do not exist", async () => {
    const { documentRepository, categoryRepository, roleRepository, fileStorage } = makeDeps();
    roleRepository.countByIds = async () => 0;
    const useCase = new UploadDocument(
      documentRepository,
      categoryRepository,
      roleRepository,
      fileStorage,
    );
    await assert.rejects(
      useCase.execute(
        {
          originalName: "report.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n"),
        },
        { categoryId: "c1", roleIds: ["ghost"], assignAllRoles: false },
        "u1",
      ),
      InvalidRoleAssignmentError,
    );
  });
});
