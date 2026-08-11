import status from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const getMyNotificationsFromDB = async (userId: string, all?: boolean) => {
  const where: Prisma.NotificationWhereInput = { userId };
  if (!all) {
    where.isRead = false;
  }
  const result = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const markNotificationAsReadInDB = async (
  userId: string,
  notificationId: string,
) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError(status.NOT_FOUND, "Notification not found");
  }

  if (notification.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Forbidden access to notification");
  }

  const result = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
    select: {
      id: true,
    },
  });
  return result;
};

const markAllNotificationsAsReadInDB = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return result;
};

export const NotificationService = {
  getMyNotificationsFromDB,
  markNotificationAsReadInDB,
  markAllNotificationsAsReadInDB,
};
