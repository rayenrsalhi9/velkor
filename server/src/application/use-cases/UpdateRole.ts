import type { RoleRepository } from "../ports/RoleRepository.js";
import type { RoleUpdateInput } from "../ports/RoleRepository.js";
import type { NotificationRepository } from "../ports/NotificationRepository.js";
import { Role } from "../../domain/entities/Role.js";
import { RoleNotFoundError } from "../errors/RoleNotFoundError.js";
import { RoleNameConflictError } from "../errors/RoleNameConflictError.js";
import { assertValidClaims } from "../claims/assertValidClaims.js";
import { completeClaims } from "../claims/completeClaims.js";

export class UpdateRole {
  constructor(
    private roleRepository: RoleRepository,
    private notificationRepository: NotificationRepository,
  ) {}

  async execute(
    id: string,
    input: RoleUpdateInput,
    actorId?: string,
  ): Promise<Role> {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      throw new RoleNotFoundError();
    }

    let claims: string[] | undefined;
    if (input.claims) {
      claims = completeClaims(input.claims);
      assertValidClaims(claims);
    }

    if (input.name) {
      const nameTaken = await this.roleRepository.findByName(input.name);
      if (nameTaken && nameTaken.id !== id) {
        throw new RoleNameConflictError();
      }
    }

    const role = await this.roleRepository.update(id, claims ? { ...input, claims } : input);

    if (claims && !sameClaims(existing.claims, claims)) {
      try {
        const userIds = await this.roleRepository.listUserIdsByRoleIds([id]);
        await this.notificationRepository.createMany(
          userIds.map((userId) => ({
            userId,
            type: "claim_updated",
            title: "Access updated",
            body: `Your permissions for the ${role.name} role changed.`,
            actorId: actorId ?? null,
            refType: "role",
            refId: id,
          })),
        );
      } catch {
        // ponytail: notification failure must not block role update
      }
    }

    return role;
  }
}

function sameClaims(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();
  return [...a].sort().every((claim, i) => claim === sortedB[i]);
}
