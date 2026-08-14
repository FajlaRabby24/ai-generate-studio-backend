import { Router } from "express";
import { GenerationType } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { checkGenerateAuth } from "../../middleware/checkGenerateAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ResumeAnalyzer } from "./resumeAnalyzer.controller";
import { ResumeAnalyzerValidation } from "./resumeAnalyzer.zod";
import { rateLimiters } from "../../utils/rate-limit";

const router = Router();

// router.post(
//   "/",
//   multerUpload.single("single-pdf"),
//   validateRequest(ResumeAnalyzerValidation.analyzeValidationSchema),
//   ResumeAnalyzer.resumeAnalyzer,
// );

router.post(
  "/",
  rateLimiters.generationLimiter,
  multerUpload.single("single-pdf"),
  validateRequest(ResumeAnalyzerValidation.analyzeValidationSchema),
  checkAuth(),
  checkGenerateAuth(GenerationType.RESUME_ANALYZER),
  ResumeAnalyzer.analyzeResumeWithGroqController,
);

router.post(
  "/generate-pdf",
  rateLimiters.generationLimiter,
  validateRequest(ResumeAnalyzerValidation.generatePdfValidationSchema),
  checkAuth(),
  ResumeAnalyzer.generateResumePdfController,
);

router.get("/recent", checkAuth(), ResumeAnalyzer.getRecentGeneration);

export const ResumeAnalyzerRoutes = router;
