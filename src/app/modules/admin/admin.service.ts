import status from "http-status";
import {
  PaymentStatus,
  Plan,
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";

const getDashboardStats = async () => {
  // 1. Fetch total counts
  const totalUsers = await prisma.user.count({
    where: { isDeleted: false },
  });

  const activeSubscriptions = await prisma.subscription.count({
    where: { status: SubscriptionStatus.ACTIVE },
  });

  // 2. Compute total successful revenue
  const revenueAggregation = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.SUCCESS,
    },
  });
  const totalRevenue = revenueAggregation._sum.amount || 0;

  // 3. Fetch total platform content generations count
  const totalGenerations = await prisma.generation.count();

  // 4. Group generation logs by type
  const generationStatsGrouped = await prisma.generation.groupBy({
    by: ["type"],
    _count: {
      _all: true,
    },
  });

  const generationStats = generationStatsGrouped.map((item) => ({
    type: item.type,
    count: item._count._all,
  }));

  // 5. Calculate monthly revenue chart data for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.SUCCESS,
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      amount: true,
      createdAt: true,
    },
  });

  const monthlyRevenue: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
    monthlyRevenue[label] = 0;
  }

  payments.forEach((pay) => {
    const label = new Date(pay.createdAt).toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
    if (monthlyRevenue[label] !== undefined) {
      monthlyRevenue[label] += pay.amount;
    }
  });

  const chartData = Object.keys(monthlyRevenue)
    .reverse()
    .map((month) => ({
      month,
      revenue: parseFloat(monthlyRevenue[month]!.toFixed(2)),
    }));

  // 6. Fetch recent transactions (top 5)
  const recentPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // 7. Fetch recent users (top 5)
  const recentUsers = await prisma.user.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      role: true,
      createdAt: true,
    },
  });

  return {
    totalUsers,
    activeSubscriptions,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalGenerations,
    generationStats,
    chartData,
    recentPayments,
    recentUsers,
  };
};

const getAllUsers = async (params: Record<string, any>) => {
  const queryParams = {
    ...params,
    searchTerm: params.search,
  };

  const queryBuilder = new QueryBuilder(prisma.user, queryParams, {
    searchableFields: ["name", "email"],
    filterableFields: ["plan", "status"],
  });

  const result = await queryBuilder
    .search()
    .filter()
    .sort()
    .paginate()
    .where({ isDeleted: false, role: UserRole.USER })
    .include({ subscription: true })
    .execute();

  return result;
};

const updateUserStatus = async (userId: string, userStatus: UserStatus) => {
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: userStatus },
  });
  return user;
};

const updateUserPlan = async (userId: string, plan: Plan) => {
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const isPro = plan === Plan.PRO;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      textToImage: isPro ? 5 : 3,
      aiChatbot: isPro ? 5 : 3,
      codeChecker: isPro ? 5 : 3,
      imageBackgroundRemover: isPro ? 5 : 3,
      imageCaptionGenerator: isPro ? 5 : 3,
      resumeAnalyzer: isPro ? 5 : 3,
      languageTranslator: isPro ? 5 : 3,
      grammarChecker: isPro ? 5 : 3,
      textToSpeech: isPro ? 25 : 10,
      speechToText: isPro ? 5 : 3,
      imageToVideo: isPro ? 3 : 1,
      textToVideo: isPro ? 3 : 1,
    },
  });
  return user;
};

const getAllPayments = async (params: Record<string, any>) => {
  const queryParams = {
    ...params,
    searchTerm: params.search,
  };

  const queryBuilder = new QueryBuilder(prisma.payment, queryParams, {
    searchableFields: ["transactionId", "user.name", "user.email"],
  });

  const result = await queryBuilder
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    })
    .execute();

  return result;
};

export const AdminService = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  updateUserPlan,
  getAllPayments,
};
