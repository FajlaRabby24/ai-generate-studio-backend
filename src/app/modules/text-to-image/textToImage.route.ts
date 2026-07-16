import { Router } from "express";
import { TextToImageController } from "./textToImage.controller";

const router = Router();

router.post("/", TextToImageController.generateImage);

export const TextToImageRoutes = router;
