import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ShipmentStatus,
  UserRole,
} from "../../../generated/prisma/enums";

const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PICKUP_SCHEDULED", "CANCELLED"],
  PICKUP_SCHEDULED: ["COURIER_ASSIGNED", "CANCELLED"],
  COURIER_ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["AT_ORIGIN_HUB", "IN_TRANSIT"],
  AT_ORIGIN_HUB: ["IN_TRANSIT"],
  IN_TRANSIT: ["AT_DESTINATION_HUB", "RETURN_IN_TRANSIT"],
  AT_DESTINATION_HUB: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELIVERY_FAILED"],
  DELIVERY_FAILED: ["OUT_FOR_DELIVERY", "RETURN_INITIATED"],
  RETURN_INITIATED: ["RETURN_IN_TRANSIT"],
  RETURN_IN_TRANSIT: ["RETURNED"],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
};

const adminManagedStatuses: ShipmentStatus[] = [
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "AT_ORIGIN_HUB",
  "IN_TRANSIT",
  "AT_DESTINATION_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_FAILED",
  "RETURN_INITIATED",
  "RETURN_IN_TRANSIT",
  "RETURNED",
];

const courierManagedStatuses: ShipmentStatus[] = [
  "PICKED_UP",
  "AT_ORIGIN_HUB",
  "IN_TRANSIT",
  "AT_DESTINATION_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_FAILED",
  "RETURN_INITIATED",
  "RETURN_IN_TRANSIT",
  "RETURNED",
];

const addTrackingEvent = async (
  shipmentId: string,
  userId: string,
  role: UserRole,
  data: { status: ShipmentStatus; description: string; location?: string },
) => {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, deletedAt: null },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
  }

  if (role !== UserRole.ADMIN && role !== UserRole.COURIER) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only admins and couriers can update shipment tracking",
    );
  }

  const managedStatuses =
    role === UserRole.ADMIN ? adminManagedStatuses : courierManagedStatuses;
  if (!managedStatuses.includes(data.status)) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      `${role === UserRole.ADMIN ? "Admins" : "Couriers"} cannot set shipment status to ${data.status}`,
    );
  }

  if (role === UserRole.COURIER && shipment.courierId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only update shipments assigned to you",
    );
  }

  const allowedNextStatuses = validTransitions[shipment.status];
  if (!allowedNextStatuses.includes(data.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid status transition from ${shipment.status} to ${data.status}. Allowed: ${allowedNextStatuses.join(", ") || "None (Terminal State)"}`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.shipment.updateMany({
      where: {
        id: shipmentId,
        status: shipment.status,
        deletedAt: null,
      },
      data: { status: data.status },
    });

    if (updateResult.count !== 1) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Shipment status changed before this update could be applied",
      );
    }

    const event = await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: data.status,
        description: data.description,
        location: data.location,
        createdBy: userId,
      },
    });

    const updatedShipment = await tx.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
    });

    return { event, shipment: updatedShipment };
  });

  return result;
};

const getTrackingTimeline = async (trackingNumber: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
    include: {
      trackingEvents: {
        orderBy: { createdAt: "asc" },
        include: {
          creator: { select: { name: true, role: true } },
        },
      },
      originHub: { select: { name: true, code: true, city: true } },
      destinationHub: { select: { name: true, code: true, city: true } },
    },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Tracking number not found");
  }

  return {
    trackingNumber: shipment.trackingNumber,
    currentStatus: shipment.status,
    packageType: shipment.packageType,
    originHub: shipment.originHub,
    destinationHub: shipment.destinationHub,
    timeline: shipment.trackingEvents,
  };
};

export const TrackingService = {
  addTrackingEvent,
  getTrackingTimeline,
};
