import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { NotificationService } from "./notification.service";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await NotificationService.getMyNotificationsFromDB(userId);

  sendResponse(
    res,
    status.OK,
    true,
    "Notifications fetched successfully",
    result,
  );
});

const markNotificationAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params as { id: string };
    const result = await NotificationService.markNotificationAsReadInDB(
      userId,
      id,
    );

    sendResponse(
      res,
      status.OK,
      true,
      "Notification marked as read successfully",
      result,
    );
  },
);

const markAllNotificationsAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result = await NotificationService.markAllNotificationsAsReadInDB(
      userId,
    );

    sendResponse(
      res,
      status.OK,
      true,
      "All notifications marked as read successfully",
      result,
    );
  },
);

export const NotificationController = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
