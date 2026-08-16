import {
  GenerationStatus,
  GenerationType,
  NotificationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";

const textToVideoGeneratePixazo = async (
  userId: string,
  prompt: string,
  aspectRatio?: string,
  numFrames?: number,
  frameRate?: number,
) => {
  const webhookUrl = `${envVars.BACKEND_SERVER_URL}/api/v1/text-to-video/webhook/callback`;
  const url = "https://gateway.pixazo.ai/ltx-video/v1/text-to-video";
  const headers = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": envVars.PIXAZO_SUBSCRIPTION_KEY || "",
    "X-Webhook-URL": webhookUrl,
    "X-Webhook-Mode": "sync",
  };
  const data = {
    prompt: prompt,
    aspect: aspectRatio,
    num_frames: numFrames,
    frame_rate: frameRate,
    enhance_prompt: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Pixazo API request failed: ${res.statusText}`);
  }

  const responseJson = (await res.json()) as {
    request_id?: string;
    status?: string;
    polling_url?: string;
  };

  // Save the queued generation record in database
  if (responseJson && responseJson.request_id) {
    setImmediate(() => {
      (async () => {
        try {
          await prisma.$transaction(async (tx) => {
            const generated = await tx.generated.create({
              data: {
                userId,
                type: GenerationType.TEXT_TO_VIDEO,
              },
            });

            await tx.textToVideo.create({
              data: {
                generatedId: generated.id,
                status: GenerationStatus.QUEUED,
                prompt,
                requestId: responseJson.request_id!,
                outputUrl: "", // placeholder until webhook/polling completes
              },
            });
          });
        } catch (dbError) {
          // console.error("[Background DB Error - Text to Image]:", dbError);
        }
      })();
    });
  }

  return responseJson;
};

const getRecentGeneration = async (userId: string) => {
  const generations = await prisma.generated.findMany({
    where: {
      userId,
      type: GenerationType.TEXT_TO_VIDEO,
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    include: {
      textToVideos: true,
    },
  });

  return generations;
};

// * webhook
const updateVideoStatusFromWebhook = async (payload: {
  request_id: string;
  status: string;
  output?: {
    media_url: string[];
    media_type: string;
  };
  error?: string | null;
}) => {
  const { request_id, status, output, error } = payload;

  // 1. Locate the textToVideo record by requestId
  const textToVideoRecord = await prisma.textToVideo.findFirst({
    where: { requestId: request_id },
    include: { generated: true },
  });

  if (!textToVideoRecord) {
    throw new Error(
      `TextToVideo log with requestId: ${request_id} not found in database.`,
    );
  }

  // 2. Handle completed vs failed statuses
  if (
    status === GenerationStatus.COMPLETED &&
    output?.media_url &&
    output.media_url[0]
  ) {
    const videoUrl = output.media_url[0];
    let secureUrl = videoUrl;

    setImmediate(() => {
      (async () => {
        await prisma.$transaction(async (tx) => {
          // Update generation state to completed
          await tx.textToVideo.update({
            where: { id: textToVideoRecord.id },
            data: {
              status: GenerationStatus.COMPLETED,
              outputUrl: secureUrl,
            },
          });

          // Deduct user limits for the successful generation
          await tx.user.update({
            where: { id: textToVideoRecord.generated.userId },
            data: {
              textToVideoLastRefreshAT: new Date(),
              textToVideo: {
                decrement: 1,
              },
            },
          });
          // Create success notification
          await tx.notification.create({
            data: {
              userId: textToVideoRecord.generated.userId,
              title: "Video Generation Success",
              message: `Your generated video for prompt: "${textToVideoRecord.prompt.substring(0, 60)}..." is ready!`,
              type: NotificationType.SYSTEM,
            },
          });
        });
      })();
    });

    return true;
  } else {
    setImmediate(() => {
      (async () => {
        await prisma.$transaction(async (tx) => {
          // Update generation status to failed
          await tx.textToVideo.update({
            where: { id: textToVideoRecord.id },
            data: {
              status: GenerationStatus.FAILED,
              outputUrl: error || "Generation failed",
            },
          });
          // Create failure notification
          await tx.notification.create({
            data: {
              userId: textToVideoRecord.generated.userId,
              title: "Video Generation Failed",
              message: `Your video generation request for prompt: "${textToVideoRecord.prompt.substring(0, 60)}..." failed. Error: ${error || "Unknown error"}.`,
              type: NotificationType.ALERT,
            },
          });
        });
      })();
    });

    return false;
  }
};

export const TextToVideoService = {
  textToVideoGeneratePixazo,
  getRecentGeneration,
  updateVideoStatusFromWebhook,
};
