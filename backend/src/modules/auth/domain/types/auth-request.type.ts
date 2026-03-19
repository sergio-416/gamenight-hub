import type { Request } from "express";
import type { AuthUser } from "../interfaces/auth-user.interface.js";

export interface AuthRequest extends Request {
  user?: AuthUser;
}
