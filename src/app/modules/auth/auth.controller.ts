import type { Request, Response } from "express";
import status from "http-status";
import type { GenerationType } from "../../../generated/prisma/enums";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import type { IRequestUser } from "../../types";
import { cookieUtils } from "../../utils/cookie";
import {
  betterAuthSessionCookieName,
  tokenUtils,
} from "../../utils/tokenUtils";
import { AuthService } from "./auth.service";

// * register user
const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  sendResponse(
    res,
    status.CREATED,
    true,
    "User registered successfully",
    result,
  );
});

// * login user
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.loginUser(req, payload);
  const { accessToken, refreshToken, token } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);

  sendResponse(res, status.OK, true, "User logged in successfully", result);
});

// * get me
const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) {
    return sendResponse(res, status.UNAUTHORIZED, false, "User ID required!");
  }
  const result = await AuthService.getMeFromDB(userId);

  sendResponse(res, status.OK, true, "User data fetched successfully", result);
});

// * update profile
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.updateProfileInDB(req.user.id, req.body);

  sendResponse(res, status.OK, true, "Profile updated successfully", result);
});

// * logout user
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const { id: userId, sessionId } = req.user as IRequestUser;
  const token = cookieUtils.getCookie(req, betterAuthSessionCookieName);
  if (!userId && !token) {
    return sendResponse(res, status.UNAUTHORIZED, false, "User ID required!");
  }
  if (!sessionId) throw new Error("Session id not found");

  const result = await AuthService.logoutSession(
    userId,
    sessionId as string,
    token as string,
  );
  if (!result) {
    return sendResponse(res, status.NOT_FOUND, false, "Session not found!");
  }

  sendResponse(res, status.OK, true, "Logged out successfully", null);
});

// * get generation left count
const getGenerationLeftCount = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const type = req.query.type as GenerationType;

    if (!userId) {
      return sendResponse(res, status.UNAUTHORIZED, false, "User ID required!");
    }

    if (!type) {
      return sendResponse(
        res,
        status.BAD_REQUEST,
        false,
        "Generation type is required as a query parameter (e.g. ?type=textToImage)!",
      );
    }

    const result = await AuthService.getGenerationLeftCount(userId, type);

    sendResponse(
      res,
      status.OK,
      true,
      "Generation left count fetched successfully",
      result,
    );
  },
);

export const AuthController = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  logoutUser,
  getGenerationLeftCount,
};
