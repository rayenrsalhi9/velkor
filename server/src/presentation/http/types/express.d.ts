import type { CurrentUser } from "../../../application/use-cases/GetCurrentUser.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      currentUser?: CurrentUser;
    }
  }
}
