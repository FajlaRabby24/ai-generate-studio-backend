import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { DashboardController } from "./dashboard.controller";

const router = Router();

router.get(
  "/stats",
  checkAuth(UserRole.USER),
  DashboardController.getUserDashboardStats,
);

export const DashboardRoutes = router;
