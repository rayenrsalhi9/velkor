import type { UserClaims } from "../../../application/use-cases/GetCurrentUserClaims.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      claims?: UserClaims;
    }
  }
}
