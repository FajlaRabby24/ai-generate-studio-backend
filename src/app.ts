import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Application, Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import path from "path";
import qs from "qs";
import { envVars } from "./app/config/env";
import { auth } from "./app/lib/auth";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { WebhookRoutes } from "./app/modules/webhook/webhook.route";
import { indexRoute } from "./app/routes";
import { rateLimiters } from "./app/utils/rate-limit";

const app: Application = express();

// app.set("trust proxy", true);

app.set("query parser", (str: string) => qs.parse(str));
app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

// Security headers and rate limiting
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);
app.use(rateLimiters.globalLimiter);

app.use(
  cors({
    credentials: true,
    origin: [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL],
    methods: ["GET", "POST", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Mount better-auth
app.use("/api/auth", toNodeHandler(auth));

// Stripe Webhook Raw Body Parser
app.use(
  "/api/v1/webhook",
  express.raw({ type: "application/json" }),
  WebhookRoutes,
);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Application routes
app.use("/api/v1", indexRoute);

app.get("/", (_: Request, res: Response) => {
  res.send("AI Generate Studio Server is running");
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
