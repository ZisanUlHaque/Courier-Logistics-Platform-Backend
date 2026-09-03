import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { Prisma } from "../../../generated/prisma/client";

const createHub = async (data: any) => {
  return prisma.hub.create({ data });
};

const getAllHubs = async (query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(Math.max(1, Number(query.limit) || 10), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.HubWhereInput = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.city) where.city = { contains: query.city, mode: "insensitive" };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.hub.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.hub.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const updateHub = async (hubId: string, data: any) => {
  const hub = await prisma.hub.findFirst({
    where: { id: hubId, deletedAt: null },
  });
  if (!hub) throw new AppError(httpStatus.NOT_FOUND, "Hub not found");
  return prisma.hub.update({ where: { id: hubId }, data });
};

const deleteHub = async (hubId: string) => {
  const hub = await prisma.hub.findFirst({
    where: { id: hubId, deletedAt: null },
  });
  if (!hub) throw new AppError(httpStatus.NOT_FOUND, "Hub not found");
  return prisma.hub.update({
    where: { id: hubId },
    data: { deletedAt: new Date(), status: "INACTIVE" },
  });
};

export const HubService = { createHub, getAllHubs, updateHub, deleteHub };
