import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { HistoryService } from "./history.service";

const getMyHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { type, page, limit } = req.query;

  const result = await HistoryService.getMyHistoryFromDB(userId, {
    type: type as any,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendResponse(
    res,
    status.OK,
    true,
    "User history fetched successfully",
    result,
  );
});

const deleteHistoryItem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params as { id: string };

  const result = await HistoryService.deleteHistoryItemFromDB(userId, id);

  sendResponse(
    res,
    status.OK,
    true,
    "History item deleted successfully",
    result,
  );
});

export const HistoryController = {
  getMyHistory,
  deleteHistoryItem,
};
