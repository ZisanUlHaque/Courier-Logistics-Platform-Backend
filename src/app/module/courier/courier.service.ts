import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { Prisma } from "../../../generated/prisma/client";

const getProfile = async (userId: string) => {
  const profile = await prisma.courierProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!profile)
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found");
  return profile;
};

const updateAvailability = async (
  userId: string,
  data: Prisma.CourierProfileUpdateInput,
) => {
  const profile = await prisma.courierProfile.findUnique({ where: { userId } });
  if (!profile)
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found");
  return prisma.courierProfile.update({ where: { userId }, data });
};

const getAssignedShipments = async (courierId: string, query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(Math.max(1, Number(query.limit) || 10), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.ShipmentWhereInput = { courierId, deletedAt: null };
  if (query.status) where.status = query.status;

  const [data, total] = await prisma.$transaction([
    prisma.shipment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        addresses: true,
        customer: { select: { id: true, name: true, phone: true } },
      },
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const CourierService = {
  getProfile,
  updateAvailability,
  getAssignedShipments,
};
