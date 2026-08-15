import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { HistoryService } from "./history.service";

const getMyHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await HistoryService.getMyHistoryFromDB(userId, req.query);

  sendResponse(
    res,
    status.OK,
    true,
    "User history fetched successfully",
    result.data,
    result.meta,
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

const getRecentMedia = catchAsync(async (req: Request, res: Response) => {
  const result = await HistoryService.getRecentMediaFromDB();

  sendResponse(
    res,
    status.OK,
    true,
    "Recent media generations fetched successfully",
    result,
  );
});

export const HistoryController = {
  getMyHistory,
  deleteHistoryItem,
  getRecentMedia,
};
