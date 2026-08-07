import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { GenerationStatus, GenerationType } from "../../../generated/prisma/enums";

const getMyHistoryFromDB = async (
  userId: string,
  query: Record<string, any>,
) => {
  const { searchTerm } = query;

  // Custom search filters across child tables
  const searchConditions: any[] = [];
  if (searchTerm) {
    searchConditions.push({
      OR: [
        { textToImages: { some: { prompt: { contains: searchTerm, mode: "insensitive" } } } },
        { textToVideos: { some: { prompt: { contains: searchTerm, mode: "insensitive" } } } },
        { imageToVideos: { some: { prompt: { contains: searchTerm, mode: "insensitive" } } } },
        { aichats: { some: { input: { contains: searchTerm, mode: "insensitive" } } } },
        { resumeAnalyzers: { some: { summary: { contains: searchTerm, mode: "insensitive" } } } },
        { textToSpeeches: { some: { prompt: { contains: searchTerm, mode: "insensitive" } } } },
      ],
    });
  }

  const historyQuery = new QueryBuilder(prisma.generated, query, {
    filterableFields: ["type"],
  })
    .where({
      userId,
      isDeleted: false,
      ...(searchConditions.length > 0 ? { AND: searchConditions } : {}),
    })
    .filter()
    .sort()
    .paginate();

  // Eager load child relations
  historyQuery.include({
    textToImages: true,
    textToVideos: true,
    backgroundRemoves: true,
    imageToVideos: true,
    aichats: true,
    resumeAnalyzers: true,
    textToSpeeches: true,
  });

  const result = await historyQuery.execute();

  // Map nested objects to match the flat structure frontend expects
  const formattedData = result.data.map((item: any) => {
    let prompt = "";
    let outputUrls = "";
    let status = "COMPLETED";
    let requestId = "";

    if (item.textToImages && item.textToImages[0]) {
      prompt = item.textToImages[0].prompt;
      outputUrls = item.textToImages[0].outputUrl;
      status = item.textToImages[0].status;
    } else if (item.textToVideos && item.textToVideos[0]) {
      prompt = item.textToVideos[0].prompt;
      outputUrls = item.textToVideos[0].outputUrl;
      status = item.textToVideos[0].status;
      requestId = item.textToVideos[0].requestId;
    } else if (item.backgroundRemoves && item.backgroundRemoves[0]) {
      prompt = "Remove background from uploaded image";
      outputUrls = item.backgroundRemoves[0].outputUrls;
      status = item.backgroundRemoves[0].status;
    } else if (item.imageToVideos && item.imageToVideos[0]) {
      prompt = item.imageToVideos[0].prompt;
      outputUrls = item.imageToVideos[0].outputUrl;
      status = item.imageToVideos[0].status;
      requestId = item.imageToVideos[0].requestId;
    } else if (item.aichats && item.aichats[0]) {
      prompt = item.aichats[0].input;
      outputUrls = item.aichats[0].output;
      status = item.aichats[0].status;
    } else if (item.resumeAnalyzers && item.resumeAnalyzers[0]) {
      prompt = "Resume analysis & review";
      outputUrls = JSON.stringify(item.resumeAnalyzers[0]);
      status = item.resumeAnalyzers[0].status;
    } else if (item.textToSpeeches && item.textToSpeeches[0]) {
      prompt = item.textToSpeeches[0].prompt;
      outputUrls = item.textToSpeeches[0].audioUrl;
      status = item.textToSpeeches[0].status;
    }

    return {
      id: item.id,
      userId: item.userId,
      type: item.type,
      isDeleted: item.isDeleted,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      prompt,
      outputUrls,
      status,
      projectId: requestId,
    };
  });

  return {
    meta: result.meta,
    data: formattedData,
  };
};

const deleteHistoryItemFromDB = async (userId: string, id: string) => {
  const result = await prisma.generated.update({
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
