import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { generateController } from "./generate.controller";

const router = Router();

router.post(
  "/text-to-image",
  checkAuth(UserRole.USER),
  generateController.textToImage,
);

export const generateRoutes = router;
