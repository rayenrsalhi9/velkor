import type {
  DocumentRepository,
  UpdateDocumentInput,
} from "../ports/DocumentRepository.js";
import type { CategoryRepository } from "../ports/CategoryRepository.js";
import type { Document } from "../../domain/entities/Document.js";
import { InvalidRoleAssignmentError } from "../errors/InvalidRoleAssignmentError.js";
import { CategoryNotFoundError } from "../errors/CategoryNotFoundError.js";

export class UpdateDocument {
  constructor(
    private documentRepository: DocumentRepository,
    private categoryRepository: CategoryRepository,
  ) {}

  async execute(id: string, input: UpdateDocumentInput): Promise<Document> {
    if (input.roleIds !== undefined || input.assignAllRoles !== undefined) {
      const roleIds = input.roleIds ?? [];
      const assignAllRoles = input.assignAllRoles ?? false;
      if (roleIds.length === 0 && !assignAllRoles) {
        throw new InvalidRoleAssignmentError(
          "At least one role must be assigned",
        );
      }
      if (roleIds.length > 0 && assignAllRoles) {
        throw new InvalidRoleAssignmentError(
          "Either pick roles or assign to all, not both",
        );
      }
    }
    if (input.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new CategoryNotFoundError();
      }
    }
    return this.documentRepository.update(id, input);
  }
}
