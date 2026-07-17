import { Router } from "express";
import { GenerationType } from "../../generated/prisma/enums";
import { checkAuth } from "../middleware/checkAuth";
import { checkGenerateAuth } from "../middleware/checkGenerateAuth";
import { AiChatBotRoutes } from "../modules/ai-chat-bot/aiChatBot.routes";
import { AuthRoutes } from "../modules/auth/auth.route";
import { BackgroundRoutes } from "../modules/background-remover/backgroundRemover.routes";
import { TextToImageRoutes } from "../modules/text-to-image/textToImage.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use(
  "/text-to-image",
  checkAuth(),
  checkGenerateAuth(GenerationType.TEXT_TO_IMAGE),
  TextToImageRoutes,
);
router.use(
  "/ai-chat-bot",
  checkAuth(),
  checkGenerateAuth(GenerationType.AI_CHATBOT),
  AiChatBotRoutes,
);

router.use("/background-remove", BackgroundRoutes);

export const indexRoute = router;
