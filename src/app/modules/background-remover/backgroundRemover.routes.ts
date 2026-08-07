import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { BackgroundRemover } from "./backgroundRemover.controller";
import { BackgroundRemoverValidation } from "./backgroundRemover.zod";

const router = Router();

router.post(
  "/",
  validateRequest(BackgroundRemoverValidation.backgroundRemover),
  checkAuth(),
  multerUpload.single("singleFile"),
  checkGenerateAuth(GenerationType.IMAGE_BACKGROUND_REMOVER),
  BackgroundRemover.backgroundRemover,
);

export const BackgroundRoutes = router;
