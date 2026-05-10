import type { Request } from "express";
import status from "http-status";
import { UAParser } from "ua-parser-js";
import { UserStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/tokenUtils";
import type { TLoginUser, TRegisterUser, TUpdateProfile } from "./auth.type";

const registerUser = async (payload: TRegisterUser) => {
  const { name, email, password, image } = payload;

  const result = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
      image,
    },
  });

  return {
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    image: result.user.image,
  };
};

const loginUser = async (req: Request, payload: TLoginUser) => {
  const { email, password, userAgent: clientUserAgent } = payload;

  const data = await auth.api.signInEmail({
    body: { email, password },
  });

  if (!data?.token) {
    throw new AppError(401, "Invalid credentials");
  }

  // Check user status (BANNED or DELETED)
  if (data.user.status === UserStatus.BANNED || data.user.status === UserStatus.INACTIVE || data.user.isDeleted) {
    throw new AppError(403, "User is banned or account is deleted");
  }

  const session = await prisma.session.findFirst({
    where: { token: data.token },
    select: { id: true },
  });

  const rawUserAgent = clientUserAgent ?? req.headers["user-agent"] ?? "unknown";
  const parser = new UAParser(rawUserAgent);
  const os = parser.getOS();
  const device = parser.getDevice();

  const formattedUserAgent =
    device.type === "mobile" || device.type === "tablet"
      ? `${device.vendor ?? ""} ${device.model ?? ""} (${os.name ?? "Unknown"})`.trim()
      : `${os.name ?? "Unknown"} ${os.version ?? ""}`.trim() || rawUserAgent;

  const rawIp = req.ip ?? req.socket.remoteAddress ?? null;
  const ipAddress = rawIp === "::1" ? "127.0.0.1" : rawIp;

  // Update session with IP and User Agent
  await prisma.session.updateMany({
    where: { token: data.token },
    data: {
      ipAddress,
      userAgent: formattedUserAgent,
    },
  });

  const tokenInfo = {
    id: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    image: data.user.image,
    status: data.user.status,
    sessionId: session?.id,
  };

  const accessToken = await tokenUtils.getAccessToken(tokenInfo);
  const refreshToken = await tokenUtils.getRefreshToken(tokenInfo);

  return {
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      image: data.user.image,
      role: data.user.role,
    },
    token: data.token,
    accessToken,
    refreshToken,
  };
};

const getMeFromDB = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isDeleted: true,
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return result;
};

const updateProfileInDB = async (userId: string, payload: TUpdateProfile) => {
  const result = await prisma.user.update({
    where: {
      id: userId,
      isDeleted: false,
    },
    data: payload,
  });

  return result;
};

export const AuthService = {
  registerUser,
  loginUser,
  getMeFromDB,
  updateProfileInDB,
};
