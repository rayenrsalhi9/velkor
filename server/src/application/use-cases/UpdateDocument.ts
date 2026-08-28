import type {
  DocumentRepository,
  UpdateDocumentInput,
} from "../ports/DocumentRepository.js";
import type { CategoryRepository } from "../ports/CategoryRepository.js";
import type { RoleRepository } from "../ports/RoleRepository.js";
import type { NotificationRepository } from "../ports/NotificationRepository.js";
import type { Document } from "../../domain/entities/Document.js";
import { InvalidRoleAssignmentError } from "../errors/InvalidRoleAssignmentError.js";
import { CategoryNotFoundError } from "../errors/CategoryNotFoundError.js";

export class UpdateDocument {
  constructor(
    private documentRepository: DocumentRepository,
    private categoryRepository: CategoryRepository,
    private roleRepository: RoleRepository,
    private notificationRepository: NotificationRepository,
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
      if (roleIds.length > 0) {
        const existing = await this.roleRepository.countByIds(roleIds);
        if (existing !== roleIds.length) {
          throw new InvalidRoleAssignmentError(
            "One or more assigned roles do not exist",
          );
        }
      }
    }
    if (input.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new CategoryNotFoundError();
      }
    }

    const before = input.roleIds !== undefined
      ? await this.documentRepository.findById(id)
      : null;

    const doc = await this.documentRepository.update(id, input);

    if (before && input.roleIds !== undefined) {
      const added = input.roleIds.filter((rid) => !before.roleIds.includes(rid));
      const removed = before.roleIds.filter((rid) => !input.roleIds!.includes(rid));

      if (added.length > 0) {
        try {
          const addedUserIds = await this.roleRepository.listUserIdsByRoleIds(added);
          await this.notificationRepository.createMany(
            addedUserIds.map((uid) => ({
              userId: uid,
              type: "document_assigned",
              title: "Document assigned to you",
              body: doc.displayName,
              refType: "document",
              refId: doc.id,
            })),
          );
        } catch {
          // ponytail: notification failure must not block document update
        }
      }
      if (removed.length > 0) {
        try {
          const removedUserIds = await this.roleRepository.listUserIdsByRoleIds(removed);
          // N5: users who lost access no longer see a stale "assigned" notification.
          await Promise.all(
            removedUserIds.map((uid) =>
              this.notificationRepository.markReadWhere(uid, {
                type: "document_assigned",
                refType: "document",
                refId: doc.id,
              }),
            ),
          );
        } catch {
          // ponytail: mark-read failure is non-critical
        }
      }
    }

    return doc;
  }
}
