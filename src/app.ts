import type { Application, Request, Response } from "express";
import express from "express";
import { indexRoute } from "./app/routes";

const app: Application = express();

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Application routes
app.use("/api/v1", indexRoute);

app.get("/", (req: Request, res: Response) => {
  res.send("AI Generate Studio Server is running!");
});

export default app;
