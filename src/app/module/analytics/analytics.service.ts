import httpStatus from "http-status";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { IRequestUser } from "../payment/payment.interface";
import {
  PaymentTransactionStatus,
  ShipmentStatus,
  UserRole,
} from "../../../generated/prisma/enums";

const getAdminAnalytics = async () => {
  const [
    totalCustomers,
    totalCouriers,
    totalShipments,
    deliveredShipments,
    inTransitShipments,
    cancelledShipments,
    totalHubs,
    activeHubs,
    totalRevenueResult,
    totalPendingPayments,
    monthlyShipments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.CUSTOMER, deletedAt: null } }),
    prisma.user.count({ where: { role: UserRole.COURIER, deletedAt: null } }),
    prisma.shipment.count({ where: { deletedAt: null } }),
    prisma.shipment.count({
      where: { status: ShipmentStatus.DELIVERED, deletedAt: null },
    }),
    prisma.shipment.count({
      where: {
        status: {
          in: [
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.AT_ORIGIN_HUB,
            ShipmentStatus.AT_DESTINATION_HUB,
          ],
        },
        deletedAt: null,
      },
    }),
    prisma.shipment.count({
      where: { status: ShipmentStatus.CANCELLED, deletedAt: null },
    }),
    prisma.hub.count({ where: { deletedAt: null } }),
    prisma.hub.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.payment.aggregate({
      where: { status: PaymentTransactionStatus.COMPLETED },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: { status: PaymentTransactionStatus.INITIATED },
    }),
    prisma.shipment.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const totalRevenue = totalRevenueResult._sum.amount || 0;

  return {
    totalCustomers,
    totalCouriers,
    totalShipments,
    deliveredShipments,
    inTransitShipments,
    cancelledShipments,
    totalHubs,
    activeHubs,
    totalRevenue,
    totalPendingPayments,
    shipmentsByStatus: monthlyShipments,
  };
};

// ─── CUSTOMER ANALYTICS ───
const getCustomerAnalytics = async (user: IRequestUser) => {
  const totalShipments = await prisma.shipment.count({
    where: { customerId: user.userId, deletedAt: null },
  });

  const deliveredShipments = await prisma.shipment.count({
    where: {
      customerId: user.userId,
      status: ShipmentStatus.DELIVERED,
      deletedAt: null,
    },
  });

  const inTransitShipments = await prisma.shipment.count({
    where: {
      customerId: user.userId,
      status: {
        in: [
          ShipmentStatus.IN_TRANSIT,
          ShipmentStatus.PICKED_UP,
          ShipmentStatus.OUT_FOR_DELIVERY,
        ],
      },
      deletedAt: null,
    },
  });

  const cancelledShipments = await prisma.shipment.count({
    where: {
      customerId: user.userId,
      status: ShipmentStatus.CANCELLED,
      deletedAt: null,
    },
  });

  const totalSpentResult = await prisma.payment.aggregate({
    where: {
      customerId: user.userId,
      status: PaymentTransactionStatus.COMPLETED,
    },
    _sum: { amount: true },
  });

  const totalSpent = totalSpentResult._sum.amount || 0;

  return {
    totalShipments,
    deliveredShipments,
    inTransitShipments,
    cancelledShipments,
    totalSpent,
  };
};

// ─── COURIER ANALYTICS ───
const getCourierAnalytics = async (user: IRequestUser) => {
  const totalAssigned = await prisma.shipment.count({
    where: { courierId: user.userId, deletedAt: null },
  });

  const delivered = await prisma.shipment.count({
    where: {
      courierId: user.userId,
      status: ShipmentStatus.DELIVERED,
      deletedAt: null,
    },
  });

  const failed = await prisma.shipment.count({
    where: {
      courierId: user.userId,
      status: ShipmentStatus.DELIVERY_FAILED,
      deletedAt: null,
    },
  });

  const currentActive = await prisma.shipment.count({
    where: {
      courierId: user.userId,
      status: {
        in: [
          ShipmentStatus.COURIER_ASSIGNED,
          ShipmentStatus.PICKED_UP,
          ShipmentStatus.OUT_FOR_DELIVERY,
        ],
      },
      deletedAt: null,
    },
  });

  const deliverySuccessRate =
    totalAssigned > 0 ? Math.round((delivered / totalAssigned) * 100) : 0;

  return {
    totalAssigned,
    delivered,
    failed,
    currentActive,
    deliverySuccessRate: `${deliverySuccessRate}%`,
  };
};

export const AnalyticsServices = {
  getAdminAnalytics,
  getCustomerAnalytics,
  getCourierAnalytics,
};
