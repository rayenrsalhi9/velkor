import { User } from "../../domain/entities/User.js";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
}
