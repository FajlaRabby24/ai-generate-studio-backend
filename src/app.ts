import cookieParser from "cookie-parser";
import type { Application, Request, Response } from "express";
import express from "express";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { indexRoute } from "./app/routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";

const app: Application = express();

// Mount better-auth
app.all("/api/auth/*", toNodeHandler(auth));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Application routes
app.use("/api/v1", indexRoute);

app.get("/", (req: Request, res: Response) => {
  res.send("AI Generate Studio Server is running!");
});

app.use(globalErrorHandler)
app.use(notFound)

export default app;
