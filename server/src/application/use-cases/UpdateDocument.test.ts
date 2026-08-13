import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UpdateDocument } from "./UpdateDocument.js";
import { Document } from "../../domain/entities/Document.js";
import { Category } from "../../domain/entities/Category.js";
import { InvalidRoleAssignmentError } from "../errors/InvalidRoleAssignmentError.js";
import { CategoryNotFoundError } from "../errors/CategoryNotFoundError.js";
import type {
  DocumentRepository,
  UpdateDocumentInput,
} from "../ports/DocumentRepository.js";
import type { CategoryRepository } from "../ports/CategoryRepository.js";
import type { RoleRepository } from "../ports/RoleRepository.js";

function makeDeps() {
  const calls: { id: string; input: UpdateDocumentInput }[] = [];
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
      calls.push({ id, input });
      return new Document(
        id,
        input.displayName ?? "x",
        "x.pdf",
        "application/pdf",
        1,
        input.categoryId ?? "c1",
        "Policies",
        "Admin User",
        input.assignAllRoles ?? false,
        input.roleIds ?? [],
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
  return { documentRepository, categoryRepository, roleRepository, calls };
}

describe("UpdateDocument", () => {
  it("updates display name and category", async () => {
    const { documentRepository, categoryRepository, roleRepository, calls } = makeDeps();
    const useCase = new UpdateDocument(documentRepository, categoryRepository, roleRepository);
    const result = await useCase.execute("d1", {
      displayName: "Renamed",
      categoryId: "c1",
    });
    assert.equal(result.displayName, "Renamed");
    assert.deepEqual(calls[0], {
      id: "d1",
      input: { displayName: "Renamed", categoryId: "c1" },
    });
  });

  it("rejects assigning no roles", async () => {
    const { documentRepository, categoryRepository, roleRepository } = makeDeps();
    const useCase = new UpdateDocument(documentRepository, categoryRepository, roleRepository);
    await assert.rejects(
      useCase.execute("d1", { roleIds: [], assignAllRoles: false }),
      InvalidRoleAssignmentError,
    );
  });

  it("rejects both roles and assignAllRoles", async () => {
    const { documentRepository, categoryRepository, roleRepository } = makeDeps();
    const useCase = new UpdateDocument(documentRepository, categoryRepository, roleRepository);
    await assert.rejects(
      useCase.execute("d1", { roleIds: ["r1"], assignAllRoles: true }),
      InvalidRoleAssignmentError,
    );
  });

  it("rejects a missing category", async () => {
    const { documentRepository, categoryRepository, roleRepository } = makeDeps();
    const useCase = new UpdateDocument(documentRepository, categoryRepository, roleRepository);
    await assert.rejects(
      useCase.execute("d1", { categoryId: "nope" }),
      CategoryNotFoundError,
    );
  });

  it("allows role-only changes without touching category", async () => {
    const { documentRepository, categoryRepository, roleRepository, calls } = makeDeps();
    const useCase = new UpdateDocument(documentRepository, categoryRepository, roleRepository);
    await useCase.execute("d1", { roleIds: ["r2"] });
    assert.deepEqual(calls[0], { id: "d1", input: { roleIds: ["r2"] } });
  });

  it("rejects role ids that do not exist", async () => {
    const { documentRepository, categoryRepository, roleRepository } = makeDeps();
    roleRepository.countByIds = async () => 0;
    const useCase = new UpdateDocument(documentRepository, categoryRepository, roleRepository);
    await assert.rejects(
      useCase.execute("d1", { roleIds: ["ghost"] }),
      InvalidRoleAssignmentError,
    );
  });
});
