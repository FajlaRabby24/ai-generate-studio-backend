import type { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  sendResponse(res, status.CREATED, true, "User registered successfully", result);
});

export const AuthController = {
  registerUser,
};
