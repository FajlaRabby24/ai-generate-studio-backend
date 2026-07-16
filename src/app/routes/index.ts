import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { TextToImageRoutes } from "../modules/text-to-image/textToImage.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/text-to-image", TextToImageRoutes);

export const indexRoute = router;
