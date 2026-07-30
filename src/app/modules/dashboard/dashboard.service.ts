import status from "http-status";
import { GenerationType } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const userDashboardStats = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Get recent generations (last 5)
  const recentGenerations = await prisma.generation.findMany({
    where: { userId, isDeleted: false, type: GenerationType.TEXT_TO_IMAGE },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Calculate activity data for the last 7 days
  const activityData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    );

    const count = await prisma.generation.count({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    activityData.push({
      day: dayName,
      generations: count,
    });
  }
  const limit = user.plan === "FREE" ? 3 : 5;
  // Retrieve limits / quotas configuration
  const quotas = [
    {
      name: "Text to Image",
      used: Math.max(0, limit - user.textToImage),
      limit,
      remaining: user.textToImage,
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "AI Chatbot",
      used: Math.max(0, limit - user.aiChatbot),
      limit,
      remaining: user.aiChatbot,
      color: "from-emerald-500 to-teal-500",
    },
    {
      name: "Remove Background",
      used: Math.max(0, limit - user.imageBackgroundRemover),
      limit,
      remaining: user.imageBackgroundRemover,
      color: "from-sky-500 to-blue-500",
    },
    {
      name: "Resume Analyzer",
      used: Math.max(0, limit - user.resumeAnalyzer),
      limit,
      remaining: user.resumeAnalyzer,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role,
      subscription: user.subscription
        ? {
            id: user.subscription.id,
            plan: user.subscription.plan,
            status: user.subscription.status,
            currentPeriodStart: user.subscription.currentPeriodStart,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
            stripeCustomerId: user.subscription.stripeCustomerId,
          }
        : null,
    },
    quotas,
    activityData,
    recentGenerations,
  };
};

export const DashboardService = {
  userDashboardStats,
};
