import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { UserStatus } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";

const assignCourierToShipment = async (
  shipmentId: string,
  courierId: string,
  adminId: string,
) => {
  const [shipment, courierUser] = await Promise.all([
    prisma.shipment.findFirst({ where: { id: shipmentId, deletedAt: null } }),
    prisma.user.findFirst({
      where: {
        id: courierId,
        role: "COURIER",
        status: "ACTIVE",
        deletedAt: null,
      },
    }),
  ]);

  if (!shipment) throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
  if (!courierUser)
    throw new AppError(httpStatus.NOT_FOUND, "Active courier not found");
  if (
    shipment.status !== "PICKUP_SCHEDULED" &&
    shipment.status !== "COURIER_ASSIGNED"
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot assign a courier in status: ${shipment.status}. Shipment must be pickup scheduled or awaiting pickup`,
    );
  }
  if (shipment.courierId === courierId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This courier is already assigned to the shipment",
    );
  }

  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.shipment.updateMany({
      where: {
        id: shipmentId,
        status: shipment.status,
        deletedAt: null,
      },
      data: { courierId, status: "COURIER_ASSIGNED" },
    });

    if (updateResult.count !== 1) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Shipment changed before the courier could be assigned",
      );
    }

    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: "COURIER_ASSIGNED",
        description:
          shipment.courierId === null
            ? `Courier ${courierUser.name} assigned for shipment delivery`
            : `Courier reassigned to ${courierUser.name}`,
        createdBy: adminId,
      },
    });

    return tx.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
  });
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  return prisma.user.update({
    where: { id: userId },
    data: { status },
    omit: { password: true },
  });
};

const getAllUsers = async (query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(Math.max(1, Number(query.limit) || 10), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (query.role) where.role = query.role;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      omit: { password: true },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCouriers,
    totalShipments,
    deliveredShipments,
    pendingShipments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
    prisma.user.count({ where: { role: "COURIER", deletedAt: null } }),
    prisma.shipment.count({ where: { deletedAt: null } }),
    prisma.shipment.count({ where: { status: "DELIVERED", deletedAt: null } }),
    prisma.shipment.count({
      where: {
        status: {
          in: [
            "PENDING_PAYMENT",
            "CONFIRMED",
            "PICKUP_SCHEDULED",
            "IN_TRANSIT",
          ],
        },
        deletedAt: null,
      },
    }),
  ]);

  return {
    totalUsers,
    totalCouriers,
    totalShipments,
    deliveredShipments,
    pendingShipments,
  };
};

export const AdminService = {
  assignCourierToShipment,
  updateUserStatus,
  getAllUsers,
  getDashboardStats,
};
