import { Router } from "express";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { BackgroundRemover } from "./backgroundRemover.controller";

const router = Router();

router.post(
  "/",
  checkAuth(),
  // checkGenerateAuth(GenerationType.IMAGE_BACKGROUND_REMOVER),
  multerUpload.single("singleFile"),
  BackgroundRemover.backgroundRemover,
);

export const BackgroundRoutes = router;
