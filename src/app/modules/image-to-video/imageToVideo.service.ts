import {
  GenerationStatus,
  GenerationType,
  NotificationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import DeleteFromCloudinary from "../../utils/cloudinary/deleteFromCloudinary";
import CloudinaryImageUpload from "../../utils/cloudinary/ImageUpload";

const imageToVideo = async (
  userId: string,
  fileBuffer: Buffer,
  mimetype: string,
  prompt: string,
  aspectRatio?: string,
  numFrames?: number,
  frameRate?: number,
) => {
  // 1. Upload input image base64 to Cloudinary
  const base64ForCloudinary = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;
  const uploadImage = await CloudinaryImageUpload(base64ForCloudinary);

  if (!uploadImage.success || !uploadImage.secureUrl) {
    throw new Error("Failed to upload input image to Cloudinary");
  }
  const imageUrl = uploadImage.secureUrl;

  // 2. Setup Pixazo gateway parameters
  // const webhookUrl = `${envVars.BACKEND_SERVER_URL}/api/v1/image-to-video/webhook/callback`;
  const webhookUrl = `https://9cd5v0zv-5000.asse.devtunnels.ms/api/v1/image-to-video/webhook/callback`;
  const url = "https://gateway.pixazo.ai/ltx-video/v1/image-to-video";
  const headers = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": envVars.PIXAZO_SUBSCRIPTION_KEY || "",
    "X-Webhook-URL": webhookUrl,
    "X-Webhook-Mode": "sync",
  };
  const data = {
    prompt: prompt,
    image_url: imageUrl,
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
    await DeleteFromCloudinary(uploadImage.publicId, "image");
    throw new Error(
      `Pixazo Video API Error: ${res.status} - ${res.statusText}`,
    );
  }

  const responseJson = (await res.json()) as {
    request_id?: string;
    status?: string;
    polling_url?: string;
  };

  // 3. Save the queued generation record in database
  if (responseJson && responseJson.request_id) {
    const generated = await prisma.generated.create({
      data: {
        userId,
        type: GenerationType.IMAGE_TO_VIDEO,
      },
    });

    await prisma.imageToVideo.create({
      data: {
        generatedId: generated.id,
        status: GenerationStatus.QUEUED,
        prompt,
        imageUrl,
        requestId: responseJson.request_id,
        outputUrl: "", // placeholder until webhook/polling completes
      },
    });
  }

  return responseJson;
};

// Webhook status update
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

  const generation = await prisma.imageToVideo.findFirst({
    where: { requestId: request_id },
    include: { generated: true },
  });

  if (!generation) {
    throw new Error(
      `Generation log with requestId: ${request_id} not found in database.`,
    );
  }

  // Handle completed vs failed statuses
  if (
    status === GenerationStatus.COMPLETED &&
    output?.media_url &&
    output.media_url[0]
  ) {
    const videoUrl = output.media_url[0];
    let secureUrl = videoUrl;

    // Mark generation as completed in database
    await prisma.imageToVideo.update({
      where: { id: generation.id },
      data: {
        status: GenerationStatus.COMPLETED,
        outputUrl: secureUrl,
      },
    });

    // Decrement user credit limit
    await prisma.user.update({
      where: { id: generation.generated.userId },
      data: {
        imageToVideoLastRefreshAT: new Date(),
        imageToVideo: {
          decrement: 1,
        },
      },
    });

    // Create success notification
    await prisma.notification.create({
      data: {
        userId: generation.generated.userId,
        title: "Image to Video Success",
        message: `Your image-to-video generation for prompt: "${generation.prompt.substring(0, 60)}..." is ready!`,
        type: NotificationType.SYSTEM,
      },
    });

    return true;
  } else {
    // Mark generation as failed in database
    await prisma.imageToVideo.update({
      where: { id: generation.id },
      data: {
        status: GenerationStatus.FAILED,
        outputUrl: error || "Generation failed",
      },
    });

    // Create failure notification
    await prisma.notification.create({
      data: {
        userId: generation.generated.userId,
        title: "Image to Video Failed",
        message: `Your image-to-video generation request for prompt: "${generation.prompt.substring(0, 60)}..." failed. Error: ${error || "Unknown error"}.`,
        type: NotificationType.ALERT,
      },
    });

    return false;
  }
};

export const ImageToVideoService = {
  imageToVideo,
  updateVideoStatusFromWebhook,
};
