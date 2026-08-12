import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { AdminController } from "./admin.controller";

const router = Router();

router.get(
  "/dashboard-stats",
  checkAuth(UserRole.ADMIN),
  AdminController.getDashboardStats,
);

router.get(
  "/users",
  checkAuth(UserRole.ADMIN),
  AdminController.getAllUsers,
);

router.patch(
  "/users/:userId/status",
  checkAuth(UserRole.ADMIN),
  AdminController.updateUserStatus,
);

router.patch(
  "/users/:userId/plan",
  checkAuth(UserRole.ADMIN),
  AdminController.updateUserPlan,
);

router.get(
  "/payments",
  checkAuth(UserRole.ADMIN),
  AdminController.getAllPayments,
);

export const AdminRoutes = router;
