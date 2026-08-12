import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListDocuments } from "./ListDocuments.js";
import { Document } from "../../domain/entities/Document.js";
import type {
  DocumentRepository,
  ListDocumentsParams,
} from "../ports/DocumentRepository.js";

function makeRepository(calls: ListDocumentsParams[]) {
  const documents = [
    new Document(
      "d1",
      "Summary report",
      "report.pdf",
      "application/pdf",
      1024,
      "cat-reports",
      "Reports",
      "Admin User",
    ),
    new Document(
      "d2",
      "Leave policy",
      "leave.pdf",
      "application/pdf",
      2048,
      "cat-policies",
      "Policies",
      "Sara Mansour",
    ),
  ];
  const documentRepository: DocumentRepository = {
    async list(params) {
      calls.push(params);
      return { items: documents, total: 2 };
    },
    async create(input) {
      return new Document(
        "d3",
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
      return documents.find((d) => d.id === id) ?? null;
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
        "cat-reports",
        "Reports",
        "Admin User",
      );
    },
    async softDelete() {},
  };
  return documentRepository;
}

describe("ListDocuments", () => {
  it("forwards query params to the repository and returns the list", async () => {
    const calls: ListDocumentsParams[] = [];
    const listDocuments = new ListDocuments(makeRepository(calls));
    const result = await listDocuments.execute({
      order: "asc",
      page: 1,
      pageSize: 10,
      sortBy: "displayName",
    });
    assert.equal(result.total, 2);
    assert.equal(result.items[0]?.displayName, "Summary report");
    assert.deepEqual(calls[0], {
      order: "asc",
      page: 1,
      pageSize: 10,
      sortBy: "displayName",
    });
  });

  it("forwards scope and roleIds for the assigned view", async () => {
    const calls: ListDocumentsParams[] = [];
    const listDocuments = new ListDocuments(makeRepository(calls));
    await listDocuments.execute({
      order: "desc",
      page: 2,
      pageSize: 5,
      sortBy: "createdAt",
      scope: "assigned",
      roleIds: ["role-editor"],
    });
    assert.deepEqual(calls[0], {
      order: "desc",
      page: 2,
      pageSize: 5,
      sortBy: "createdAt",
      scope: "assigned",
      roleIds: ["role-editor"],
    });
  });
});
