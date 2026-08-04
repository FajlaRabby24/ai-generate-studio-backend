import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ImageToVideoController } from "./imageToVideo.controller";
import { ImageToVideoValidation } from "./imageToVideo.zod";

const router = Router();

router.post(
  "/",
  checkAuth(),
  multerUpload.single("singleFile"),
  validateRequest(ImageToVideoValidation.generateVideoSchema),
  checkGenerateAuth(GenerationType.IMAGE_TO_VIDEO),
  ImageToVideoController.imageToVideo,
);

router.post("/webhook/callback", ImageToVideoController.handleVideoWebhook);

export const ImageToVideoRoutes = router;
