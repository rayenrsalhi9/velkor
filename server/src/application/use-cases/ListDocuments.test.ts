import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListDocuments } from "./ListDocuments.js";
import { Document } from "../../domain/entities/Document.js";
import type { DocumentRepository } from "../ports/DocumentRepository.js";

describe("ListDocuments", () => {
  it("returns the paginated list from the repository", async () => {
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
      async list() {
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
    };
    const listDocuments = new ListDocuments(documentRepository);
    const result = await listDocuments.execute({
      order: "asc",
      page: 1,
      pageSize: 10,
      sortBy: "displayName",
    });
    assert.equal(result.total, 2);
    assert.equal(result.items[0]?.displayName, "Summary report");
  });
});