import type { AuthenticatedUser } from "../modules/auth/auth.types.js";

export {};

declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
    }
  }
}
