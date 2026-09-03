import { UserRole } from "../../../generated/prisma/enums";

export interface IRequestUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface IInitiatePaymentPayload {
  shipmentId: string;
  method?: "BKASH" | "COD";
}

export interface IPaymentQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
}
