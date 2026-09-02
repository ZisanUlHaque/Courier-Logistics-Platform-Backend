import type { Request } from "express";
import { UserRole } from "../../generated/prisma/enums";

export interface IRequestUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user?: IRequestUser;
}