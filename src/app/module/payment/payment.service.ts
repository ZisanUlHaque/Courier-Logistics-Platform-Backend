import httpStatus from "http-status";
import type { PaymentWhereInput } from "../../../generated/prisma/models";
import config from "../../config";
import {
  createBkashPayment,
  executeBkashPayment,
  queryBkashPayment,
} from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { PaymentTransactionStatus, ShipmentStatus, UserRole } from "../../../generated/prisma/enums";
import { IPaymentQuery, IRequestUser } from "./payment.interface";

const initiatePayment = async (
  shipmentId: string,
  customerId: string,
  method: string,
) => {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, customerId, deletedAt: null },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found");
  }

  const existingCompletedPayment = await prisma.payment.findFirst({
    where: {
      shipmentId,
      status: PaymentTransactionStatus.COMPLETED,
    },
  });

  if (existingCompletedPayment) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Payment already completed for this shipment",
    );
  }

  const amount = shipment.deliveryFee || shipment.declaredValue || 100;

  if (method === "COD") {
    const payment = await prisma.payment.create({
      data: {
        shipmentId,
        customerId,
        amount,
        method: "COD",
        status: PaymentTransactionStatus.COMPLETED,
        transactionId: `COD-${Date.now()}`,
        paidAt: new Date(),
      },
    });

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { paymentStatus: "PAID" },
    });

    return payment;
  }

  const merchantInvoiceNumber = `CRX-${shipment.trackingNumber}-${Date.now()}`;
  const callbackURL = `${config.bkash_callback_url}?shipmentId=${shipmentId}`;

  const bkashResponse = await createBkashPayment(
    amount,
    merchantInvoiceNumber,
    callbackURL,
  );

  const payment = await prisma.payment.create({
    data: {
      shipmentId,
      customerId,
      amount,
      method: "BKASH",
      status: PaymentTransactionStatus.INITIATED,
      bkashPaymentId: bkashResponse.paymentID,
      paymentGatewayUrl: bkashResponse.bkashURL,
      transactionId: merchantInvoiceNumber,
    },
  });

  return {
    paymentId: payment.id,
    bkashPaymentId: bkashResponse.paymentID,
    bkashURL: bkashResponse.bkashURL,
    amount,
  };
};

const bkashCallback = async (query: Record<string, string>) => {
  const { paymentID, status, shipmentId } = query;

  if (!paymentID || !shipmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Missing parameters in bKash callback",
    );
  }

  const payment = await prisma.payment.findFirst({
    where: { bkashPaymentId: paymentID },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
  }

  if (status === "cancel" || status === "failure") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentTransactionStatus.CANCELLED,
        callbackRaw: query,
      },
    });

    return {
      success: false,
      message: "bKash Payment cancelled or failed",
      redirectUrl: `${config.frontend_url}/payment/failed?shipmentId=${shipmentId}`,
    };
  }

  const executeResult = await executeBkashPayment(paymentID);

  if (executeResult.transactionStatus === "Completed") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentTransactionStatus.COMPLETED,
          transactionId: executeResult.trxID,
          paidAt: new Date(),
          callbackRaw: executeResult,
        },
      });

      await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          paymentStatus: "PAID",
          status: ShipmentStatus.CONFIRMED,
        },
      });

      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId,
          status: ShipmentStatus.CONFIRMED,
          description: `bKash Payment Verified. TrxID: ${executeResult.trxID}`,
        },
      });
    });

    return {
      success: true,
      message: "Payment successfully completed",
      trxID: executeResult.trxID,
      redirectUrl: `${config.frontend_url}/payment/success?shipmentId=${shipmentId}`,
    };
  }

  return {
    success: false,
    message: "Payment execution failed",
    redirectUrl: `${config.frontend_url}/payment/failed?shipmentId=${shipmentId}`,
  };
};

const verifyPayment = async (paymentId: string, user: IRequestUser) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      shipment: {
        select: { trackingNumber: true, status: true, paymentStatus: true },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  if (user.role === UserRole.CUSTOMER && payment.customerId !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied to this payment");
  }

  if (
    payment.method === "BKASH" &&
    payment.bkashPaymentId &&
    payment.status === PaymentTransactionStatus.INITIATED
  ) {
    try {
      const bkashStatus = await queryBkashPayment(payment.bkashPaymentId);

      if (bkashStatus.transactionStatus === "Completed") {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentTransactionStatus.COMPLETED,
              transactionId: bkashStatus.trxID,
              paidAt: new Date(),
            },
          });

          await tx.shipment.update({
            where: { id: payment.shipmentId },
            data: { paymentStatus: "PAID", status: ShipmentStatus.CONFIRMED },
          });
        });

        payment.status = PaymentTransactionStatus.COMPLETED;
        payment.transactionId = bkashStatus.trxID;
      }
    } catch {
    }
  }

  return payment;
};

const getMyPayments = async (query: IPaymentQuery, user: IRequestUser) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  const andConditions: PaymentWhereInput[] = [{ customerId: user.userId }];

  if (query.status) {
    andConditions.push({ status: query.status as PaymentTransactionStatus });
  }

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        shipment: {
          select: {
            trackingNumber: true,
            status: true,
            deliveryFee: true,
          },
        },
      },
    }),
    prisma.payment.count({ where: { AND: andConditions } }),
  ]);

  return {
    data: payments,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getAllPayments = async (query: IPaymentQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  const andConditions: PaymentWhereInput[] = [];

  if (query.status) {
    andConditions.push({ status: query.status as PaymentTransactionStatus });
  }

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        shipment: { select: { trackingNumber: true, status: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.payment.count({ where: { AND: andConditions } }),
  ]);

  return {
    data: payments,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getSinglePayment = async (paymentId: string, user: IRequestUser) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      shipment: true,
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!payment) throw new AppError(httpStatus.NOT_FOUND, "Payment not found");

  if (user.role === UserRole.CUSTOMER && payment.customerId !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied to this payment");
  }

  return payment;
};

export const PaymentServices = {
  initiatePayment,
  bkashCallback,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  getSinglePayment,
};
