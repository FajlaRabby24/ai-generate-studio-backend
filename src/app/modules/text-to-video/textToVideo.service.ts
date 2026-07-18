import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import type {
  IGenerateTextToVideo,
  IJson2VideoProjectResponse,
} from "./textToVideo.types";

const generateTextToVideo = async (
  payload: IGenerateTextToVideo,
  userId: string,
) => {
  const {
    prompt,
    width = 1280,
    height = 720,
    fps = 30,
    duration = 5,
    style = "001",
    background = "#0f172a",
  } = payload;

  // TODO:💡 আপনার ngrok বা লাইভ পাবলিক ডোমেইনের সম্পূর্ণ লিংকটি এখানে বসাবেন
  const webhookUrl =
    "https://your-ngrok-subdomain.ngrok-free.app/api/v1/text-to-video/webhook";
  const url = "https://api.json2video.com/v2/movies";
  const movieData = {
    comment: "Text to video generation for Ai Generate Studio",
    width,
    height,
    fps,
    webhook: webhookUrl,
    scenes: [
      {
        duration,
        background,
        elements: [
          {
            type: "text",
            text: prompt,
            style,
          },
        ],
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": envVars.JSON2_VIDEO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(movieData),
  });

  const project = (await res.json()) as IJson2VideoProjectResponse;
  if (!project?.success) {
    throw new Error("Failed to generate video");
  }

  await prisma.generation.create({
    data: {
      projectId: project.project,
      type: GenerationType.TEXT_TO_VIDEO,
      prompt,
      userId,
      status: GenerationStatus.PENDING,
      outputUrls: "",
    },
  });

  //   {"success":true,"project":"*********f","timestamp":"2026-07-18T07:05:10.315Z"}
  console.log(project);
  return project.project;
};

const updateVideoStatusFromWebhook = async (webhookPayload: any) => {
  const { project, movie } = webhookPayload;

  console.log(
    `[Webhook Event Received] Project: ${project}, Status: ${movie?.status}`,
  );

  if (movie?.status === "done") {
    return await prisma.generation.updateMany({
      where: { projectId: project },
      data: {
        outputUrls: movie.url,
        status: GenerationStatus.COMPLETED,
      },
    });
  } else if (movie?.status === "error") {
    return await prisma.generation.updateMany({
      where: { projectId: project },
      data: {
        status: GenerationStatus.FAILED,
      },
    });
  }
};

export const TextToVideoService = {
  generateTextToVideo,
  updateVideoStatusFromWebhook,
};
