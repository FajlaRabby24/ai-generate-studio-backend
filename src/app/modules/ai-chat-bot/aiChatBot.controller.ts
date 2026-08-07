import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AiChatBot } from "./aiChatBot.service";

// const chatResponse = catchAsync(async (req: Request, res: Response) => {
//   const { message, conversationId } = req.body;
//   const userId = req.user?.id;

//   if (!userId) {
//     return sendResponse(
//       res,
//       status.UNAUTHORIZED,
//       false,
//       "Unauthorized: User not found in request context",
//       null,
//     );
//   }

//   const responseText = await AiChatBot.ChatbotService(
//     userId,
//     message,
//     conversationId,
//   );

//   sendResponse(
//     res,
//     status.OK,
//     true,
//     "Chat response generated successfully",
//     responseText,
//   );
// });

const streamChatResponse = catchAsync(async (req: Request, res: Response) => {
  const { message, conversationId } = req.body;
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

  const responseText = await AiChatBot.StreamChatbotService(
    res,
    userId,
    message,
    conversationId,
  );

  sendResponse(
    res,
    status.OK,
    true,
    "Chat response generated successfully",
    responseText,
  );
});

const getUserConversationsTitle = catchAsync(
  async (req: Request, res: Response) => {
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

    const conversations = await AiChatBot.getUserConversationsTitle(userId);

    sendResponse(
      res,
      status.OK,
      true,
      "Conversations retrieved successfully",
      conversations,
    );
  },
);

const getConversationChatsById = catchAsync(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;
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

    if (!conversationId) {
      return sendResponse(
        res,
        status.BAD_REQUEST,
        false,
        "Conversation ID is required",
        null,
      );
    }

    const conversation = await AiChatBot.getConversationChatsById(
      userId,
      conversationId as string,
    );

    sendResponse(
      res,
      status.OK,
      true,
      "Chats retrieved successfully",
      conversation,
    );
  },
);

export const AiChatBotController = {
  // chatResponse,
  streamChatResponse,
  getUserConversationsTitle,
  getConversationChatsById,
};
