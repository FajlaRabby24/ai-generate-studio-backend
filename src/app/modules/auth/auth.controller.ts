import type { Request, Response } from "express";
import status from "http-status";
import type { GenerationType } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { auth } from "../../lib/auth";
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

// * logout all session
const logoutAllSession = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as IRequestUser;
  if (!userId) {
    return sendResponse(res, status.UNAUTHORIZED, false, "Unauthorized");
  }
  const token = cookieUtils.getCookie(req, betterAuthSessionCookieName);
  if (!token) throw new Error("Session token not found");

  const result = await AuthService.logoutAllSession(userId, token as string);
  if (!result) {
    return sendResponse(res, status.NOT_FOUND, false, "Session not found!");
  }

  sendResponse(
    res,
    status.OK,
    true,
    "Logged out from other sessions successfully",
    null,
  );
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

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query?.redirect as string) || "/";

  const encodedRedirectPath = encodeURIComponent(redirectPath);
  const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;

  res.render("googleRedirect", {
    callbackURL,
    betterAuthUrl: envVars.BETTER_AUTH_URL,
  });
});

// google login success
const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = decodeURIComponent(req.query?.redirect as string) || "/";

  const sessionToken = req.cookies[betterAuthSessionCookieName];

  if (!sessionToken) {
    return res.redirect(
      `${envVars.FRONTEND_URL}/auth/login?error=oauth_failed`,
    );
  }

  // Pass the entire headers object to let better-auth handle prefixes and context
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  if (!session) {
    return res.redirect(
      `${envVars.FRONTEND_URL}/auth/login?error=no_session_found`,
    );
  }

  if (session && !session.user) {
    return res.redirect(
      `${envVars.FRONTEND_URL}/auth/login?error=no_user_found`,
    );
  }

  const result = await AuthService.googleLoginSuccess(session);
  const { accessToken, refreshToken, sessionToken: sessionTokenVal } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, sessionTokenVal);

  const isValidRedirectPath =
    redirectPath.startsWith("/") && !redirectPath.startsWith("//");
  const finalRedirectPath = isValidRedirectPath ? redirectPath : "/";

  // Redirect to frontend callback page with tokens for cross-domain session sync
  const callbackUrl = new URL(`${envVars.FRONTEND_URL}/google-callback`);
  callbackUrl.searchParams.set("accessToken", accessToken);
  callbackUrl.searchParams.set("refreshToken", refreshToken);
  callbackUrl.searchParams.set("sessionToken", sessionTokenVal);
  callbackUrl.searchParams.set("redirectPath", finalRedirectPath);

  res.redirect(callbackUrl.toString());
});

// handle oauth error
const handleOAuthError = catchAsync(async (req: Request, res: Response) => {
  const error = (req.query.error as string) || "oauth_failed";
  res.redirect(`${envVars.FRONTEND_URL}/auth/login?error=${error}`);
});

export const AuthController = {
  registerUser,
  loginUser,
  logoutAllSession,
  getMe,
  updateProfile,
  logoutUser,
  getGenerationLeftCount,
  googleLogin,
  googleLoginSuccess,
  handleOAuthError,
};
