import { Router } from "express";
import { multerUpload } from "../../config/multer.config";
import { BackgroundRemover } from "./backgroundRemover.controller";

const router = Router();

router.post(
  "/",
  multerUpload.single("singleFile"),
  BackgroundRemover.backgroundRemover,
);

export const BackgroundRoutes = router;
