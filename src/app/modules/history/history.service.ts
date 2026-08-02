import { prisma } from "../../lib/prisma";
import { GenerationType } from "../../../generated/prisma/enums";

const getMyHistoryFromDB = async (
  userId: string,
  query: { type?: GenerationType; page?: number; limit?: number },
) => {
  const { type, page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const whereCondition: any = {
    userId,
    isDeleted: false,
  };

  if (type) {
    whereCondition.type = type;
  }

  const result = await prisma.generation.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    skip,
    take: Number(limit),
  });

  const total = await prisma.generation.count({
    where: whereCondition,
  });

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
    data: result,
  };
};

const deleteHistoryItemFromDB = async (userId: string, id: string) => {
  const result = await prisma.generation.update({
    where: {
      id,
      userId,
    },
    data: {
      isDeleted: true,
    },
  });
  return result;
};

export const HistoryService = {
  getMyHistoryFromDB,
  deleteHistoryItemFromDB,
};
