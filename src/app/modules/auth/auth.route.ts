import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.registerUser,
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser,
);

router.get("/me", checkAuth(), AuthController.getMe);
// router.get("/my-profile", checkAuth(), AuthController.getMyProfile);

router.patch(
  "/me",
  checkAuth(),
  validateRequest(AuthValidation.updateProfileSchema),
  AuthController.updateProfile,
);

// router.post(
//   "/change-password",
//   checkAuth(),
//   validateRequest(authValidation.changePasswordSchema),
//   authController.changePassword,
// );

// router.post("/refresh-token", authController.getNewToken);

// router.post(
//   "/verify-email-otp",
//   validateRequest(authValidation.verifyEmailSchema),
//   authController.verifyEmail,
// );
// router.post(
//   "/forget-password",
//   validateRequest(authValidation.forgotPasswordSchema),
//   authController.forgotPassword,
// );
// router.post(
//   "/reset-password",
//   validateRequest(authValidation.resetPasswordSchema),
//   authController.resetPassword,
// );

// router.get("/sessions", checkAuth(), authController.getSessions);
router.post("/logout", checkAuth(), AuthController.logoutUser);

// router.get("/login/google", authController.googleLogin);
// router.get("/google/success", authController.googleLoginSuccess);
// router.get("/oauth/error", authController.handleOAuthError);

export const AuthRoutes = router;
