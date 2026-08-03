import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";

const getMyHistoryFromDB = async (
  userId: string,
  query: Record<string, any>,
) => {
  const historyQuery = new QueryBuilder(prisma.generation, query, {
    searchableFields: ["prompt"],
    filterableFields: ["type"],
  })
    .where({ userId, isDeleted: false })
    .search()
    .filter()
    .sort()
    .paginate();

  const result = await historyQuery.execute();
  return result;
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
    select: {
      id: true,
    },
  });
  return result;
};

export const HistoryService = {
  getMyHistoryFromDB,
  deleteHistoryItemFromDB,
};
