import status from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DashboardService } from "./dashboard.service";

const getUserDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await DashboardService.userDashboardStats(userId);

  sendResponse(
    res,
    status.OK,
    true,
    "Dashboard stats retrieved successfully",
    result
  );
});

export const DashboardController = {
  getUserDashboardStats,
};
