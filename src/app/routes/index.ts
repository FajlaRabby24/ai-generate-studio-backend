import { Router } from "express";
import { GenerationType } from "../../generated/prisma/enums";
import { checkAuth } from "../middleware/checkAuth";
import { checkGenerateAuth } from "../middleware/checkGenerateAuth";
import { AuthRoutes } from "../modules/auth/auth.route";
import { TextToImageRoutes } from "../modules/text-to-image/textToImage.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use(
  "/text-to-image",
  checkAuth(),
  checkGenerateAuth(GenerationType.TEXT_TO_IMAGE),
  TextToImageRoutes,
);

export const indexRoute = router;
