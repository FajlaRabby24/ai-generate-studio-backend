import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AiChatBot } from "./aiChatBot.service";

const chatResponse = catchAsync(async (req: Request, res: Response) => {
  const { message, chatHistory = [] } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(
      res,
      status.UNAUTHORIZED,
      false,
      "Unauthorized: User not found in request context",
      null,
    );
  }

  const responseText = await AiChatBot.ChatbotService(
    userId,
    message,
    chatHistory,
  );

  sendResponse(
    res,
    status.OK,
    true,
    "Chat response generated successfully",
    responseText,
  );
});

export const AiChatBotController = {
  chatResponse,
};
