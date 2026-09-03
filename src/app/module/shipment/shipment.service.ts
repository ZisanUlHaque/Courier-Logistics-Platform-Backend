import httpStatus from "http-status";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { generateTrackingNumber } from "../../utils/trackingNumber";
import { Prisma, ShipmentStatus, UserRole } from "../../../generated/prisma/client";

const createShipment = async (customerId: string, data: any) => {
  const trackingNumber = generateTrackingNumber();

  // Database Transaction — Shipment + Addresses + Items + Tracking Event
  const shipment = await prisma.$transaction(async (tx) => {
    const created = await tx.shipment.create({
      data: {
        trackingNumber,
        customerId,
        packageType: data.packageType || "SMALL_PARCEL",
        weight: data.weight,
        quantity: data.quantity || 1,
        declaredValue: data.declaredValue,
        deliveryFee: data.deliveryFee,
        codAmount: data.codAmount,
        specialInstructions: data.specialInstructions,
        pickupSchedule: data.pickupSchedule
          ? new Date(data.pickupSchedule)
          : null,
        status: "PENDING_PAYMENT",
        addresses: {
          create: [
            { type: "PICKUP", ...data.pickupAddress },
            { type: "DELIVERY", ...data.deliveryAddress },
          ],
        },
        items: { create: data.items },
        trackingEvents: {
          create: {
            status: "PENDING_PAYMENT",
            description: "Shipment created — awaiting payment",
            createdBy: customerId,
          },
        },
      },
      include: { addresses: true, items: true, trackingEvents: true },
    });
    return created;
  });

  return shipment;
};

const getMyShipments = async (customerId: string, query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(Math.max(1, Number(query.limit) || 10), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.ShipmentWhereInput = { customerId, deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
  if (query.search) {
    where.OR = [
      { trackingNumber: { contains: query.search, mode: "insensitive" } },
      { specialInstructions: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.shipment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [query.sortBy || "createdAt"]: query.sortOrder || "desc" },
      include: { addresses: true, items: true },
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getAllShipments = async (query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(Math.max(1, Number(query.limit) || 10), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.ShipmentWhereInput = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
  if (query.search) {
    where.OR = [
      { trackingNumber: { contains: query.search, mode: "insensitive" } },
      { customer: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.shipment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [query.sortBy || "createdAt"]: query.sortOrder || "desc" },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        courier: { select: { id: true, name: true, phone: true } },
        addresses: true,
      },
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getShipmentById = async (
  shipmentId: string,
  userId: string,
  role: UserRole,
) => {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, deletedAt: null },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      courier: { select: { id: true, name: true, phone: true } },
      addresses: true,
      items: true,
      trackingEvents: { orderBy: { createdAt: "asc" } },
      originHub: true,
      destinationHub: true,
      currentHub: true,
    },
  });

  if (!shipment) throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
  if (role === "CUSTOMER" && shipment.customerId !== userId)
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  if (role === "COURIER" && shipment.courierId !== userId)
    throw new AppError(httpStatus.FORBIDDEN, "Not assigned to you");

  return shipment;
};

const updateShipment = async (
  shipmentId: string,
  customerId: string,
  data: any,
) => {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, deletedAt: null },
  });
  if (!shipment) throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
  if (shipment.customerId !== customerId)
    throw new AppError(httpStatus.FORBIDDEN, "Not your shipment");

  const editable: ShipmentStatus[] = [
    "PENDING_PAYMENT",
    "CONFIRMED",
    "PICKUP_SCHEDULED",
  ];
  if (!editable.includes(shipment.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot update in status: ${shipment.status}`,
    );
  }

  return prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      ...data,
      pickupSchedule: data.pickupSchedule
        ? new Date(data.pickupSchedule)
        : undefined,
    },
    include: { addresses: true, items: true },
  });
};

const cancelShipment = async (shipmentId: string, customerId: string) => {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, deletedAt: null },
  });
  if (!shipment) throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
  if (shipment.customerId !== customerId)
    throw new AppError(httpStatus.FORBIDDEN, "Not your shipment");

  const cancellable: ShipmentStatus[] = [
    "PENDING_PAYMENT",
    "CONFIRMED",
    "PICKUP_SCHEDULED",
    "COURIER_ASSIGNED",
  ];
  if (!cancellable.includes(shipment.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel in status: ${shipment.status}`,
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: "CANCELLED",
        description: "Cancelled by customer",
        createdBy: customerId,
      },
    });
    return tx.shipment.update({
      where: { id: shipmentId },
      data: { status: "CANCELLED" },
    });
  });
};

export const ShipmentService = {
  createShipment,
  getMyShipments,
  getAllShipments,
  getShipmentById,
  updateShipment,
  cancelShipment,
};
