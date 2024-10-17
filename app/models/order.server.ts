import db from "~/db.server";
import type { MetaResponse } from "~/types/transport.type";

export interface OrderProps {
  id: number;
  sessionId: string;
  status: "FAILED" | "SUCCESS";
  orderId: string;
  response: string;
  payload: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface PaginatedResult<OrderProps> {
  data: OrderProps[];
  meta: MetaResponse;
}

export const Order = {
  getPaginated: async ({
    page = 1,
    pageSize = 5,
    where = "",
  }: {
    page: number;
    pageSize?: number;
    where: any;
  }): Promise<PaginatedResult<OrderProps>> => {
    const orders = await db.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalItems = await db.order.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: orders,
      meta: {
        current_page: page,
        next_page: page < totalPages ? page + 1 : null,
        prev_page: page > 1 ? page - 1 : null,
        total_pages: totalPages,
        total_items: totalItems,
        page_size: pageSize,
      },
    };
  },

  // Fetch a single order by ID
  getById: async (where: any): Promise<OrderProps | null> => {
    return await prisma.order.findUnique({
      where: where,
    });
  },

  createOrUpdate: async (data: OrderProps): Promise<OrderProps> => {
    if (data.id) {
      return await prisma.order.update({
        where: { id: data.id },
        data,
      });
    } else {
      return await prisma.order.create({
        data,
      });
    }
  },
};
