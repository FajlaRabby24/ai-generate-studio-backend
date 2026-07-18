import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Application, Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import { auth } from "./app/lib/auth";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { indexRoute } from "./app/routes";
import { rateLimiters } from "./app/utils/rate-limit";

const app: Application = express();

// Security headers and rate limiting
app.use(helmet());
app.use(rateLimiters.globalLimiter);

app.use(
  cors({
    origin: "https://hoppscotch.io", // Allow Hoppscotch web client
    credentials: true, // Required to allow the browser to accept/send cookies
  }),
);

// Mount better-auth
app.all("/api/auth/*splat", toNodeHandler(auth));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Application routes
app.use("/api/v1", indexRoute);

app.get("/", (_: Request, res: Response) => {
  res.send("AI Generate Studio Server is running!");
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
