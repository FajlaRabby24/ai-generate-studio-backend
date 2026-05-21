import type { CookieOptions, Response } from "express";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { envVars } from "../config/env";
import { cookieUtils } from "./cookie";
import { jwtUtils } from "./jwt";

const isProduction = process.env.NODE_ENV === "production";

const getAccessToken = (payload: JwtPayload) => {
  const accessToken = jwtUtils.createToken(
    payload,
    envVars.ACCESS_TOKEN_SECRET,
    { expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN } as SignOptions,
  );

  return accessToken;
};

const getRefreshToken = (payload: JwtPayload) => {
  const refreshToken = jwtUtils.createToken(
    payload,
    envVars.REFRESH_TOKEN_SECRET,
    { expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN } as SignOptions,
  );

  return refreshToken;
};

const setAccessTokenCookie = (res: Response, token: string) => {
  cookieUtils.setCookie(res, "accessToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax", // must be lax locally if not secure
    path: "/",
    maxAge: 60 * 60 * 24 * 1000, // 1 day
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  cookieUtils.setCookie(res, "refreshToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
  });
};

export const betterAuthSessionCookieName = "__Secure-better-auth.session_token";

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  cookieUtils.setCookie(res, betterAuthSessionCookieName, token, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    maxAge: 60 * 60 * 24 * 1000,
  });
};

const clearSessionCookie = (res: Response) => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax", // must match setCookie
    path: "/",
  };
  cookieUtils.clearCookie(res, "accessToken", cookieOptions);
  cookieUtils.clearCookie(res, "refreshToken", cookieOptions);
  cookieUtils.clearCookie(res, betterAuthSessionCookieName, cookieOptions);
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie,
  clearSessionCookie,
};
