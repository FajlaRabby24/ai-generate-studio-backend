import type { Request, Response } from "express";
import status from "http-status";
import type { GenerationType } from "../../../generated/prisma/enums";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { tokenUtils } from "../../utils/tokenUtils";
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
  console.log("payload", payload);
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
  tokenUtils.clearSessionCookie(res);

  sendResponse(res, status.OK, true, "User logged out successfully", null);
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
