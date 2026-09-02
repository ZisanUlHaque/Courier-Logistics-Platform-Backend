import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from "../constants";
import { PaginationMeta, PaginationQuery } from "../types/common";

export const parsePagination = (query: PaginationQuery) => {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const limit = Math.min(Math.max(1, Number(query.limit) || DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  return { page, limit, skip, sortBy, sortOrder: sortOrder as "asc" | "desc" };
};

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};