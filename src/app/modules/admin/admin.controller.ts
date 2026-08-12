import type { Request, Response } from "express";
import status from "http-status";
import { Plan, UserStatus } from "../../../generated/prisma/enums";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AdminService } from "./admin.service";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();

  sendResponse(
    res,
    status.OK,
    true,
    "Dashboard statistics fetched successfully",
    result,
  );
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { search, page, limit, plan, status: userStatus } = req.query;

  const result = await AdminService.getAllUsers({
    search: search ? String(search) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    plan: plan ? (plan as Plan) : undefined,
    status: userStatus ? (userStatus as UserStatus) : undefined,
  });

  sendResponse(
    res,
    status.OK,
    true,
    "Users fetched successfully",
    result.data,
    result.meta,
  );
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const { status: userStatus } = req.body;

  const result = await AdminService.updateUserStatus(
    userId,
    userStatus as UserStatus,
  );

  sendResponse(
    res,
    status.OK,
    true,
    "User status updated successfully",
    result,
  );
});

const updateUserPlan = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const { plan } = req.body;

  const result = await AdminService.updateUserPlan(userId, plan as Plan);

  sendResponse(
    res,
    status.OK,
    true,
    "User plan manually updated successfully",
    result,
  );
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query;

  const result = await AdminService.getAllPayments({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendResponse(
    res,
    status.OK,
    true,
    "Payment transactions fetched successfully",
    result.data,
    result.meta,
  );
});

export const AdminController = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  updateUserPlan,
  getAllPayments,
};
