import { Router } from "express";
import multer from "multer";
import { BackgroundRemover } from "./backgroundRemover.controller";

const router = Router();
const upload = multer();

router.post(
  "/",
  //   checkAuth(),
  upload.single("singleFile"),
  //   checkGenerateAuth(GenerationType.IMAGE_BACKGROUND_REMOVER),
  BackgroundRemover.backgroundRemover,
);

export const BackgroundRoutes = router;
