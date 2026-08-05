import { Blob } from "node:buffer";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import CloudinaryImageUpload from "../../utils/cloudinary/ImageUpload";

const removeBackground = async (
  userId: string,
  fileBuffer: Buffer,
  mimetype: string,
  originalname: string,
) => {
  const fileBlob = new Blob([new Uint8Array(fileBuffer)], { type: mimetype });

  console.log("file blob", fileBlob);

  const formData = new FormData();
  formData.append("size", "auto");
  formData.append("image_file", fileBlob, originalname);

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": envVars.BACKGROUND_REMOVE_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `Remove.bg API Error: ${response.status} - ${response.statusText}`,
    );
  }

  const rbgResultData = await response.arrayBuffer();
  const resultBuffer = Buffer.from(rbgResultData);
  console.log("result buffer", resultBuffer);
  const uploadImage = await CloudinaryImageUpload(resultBuffer);
  if (!uploadImage.success || !uploadImage.secureUrl) {
    throw new Error("Failed to upload background-removed image to Cloudinary");
  }

  const secureUrl = uploadImage.secureUrl;

  setImmediate(() => {
    (async () => {
      await prisma.generation.create({
        data: {
          outputUrls: secureUrl,
          type: GenerationType.IMAGE_BACKGROUND_REMOVER,
          prompt: "Remove background from uploaded image",
          userId,
          status: GenerationStatus.COMPLETED,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          imageBackgroundRemover: {
            decrement: 1,
          },
        },
      });
    })();
  });

  // Return the base64 string immediately to minimize response latency
  return secureUrl;
};

export const BackgroundRemoverService = {
  removeBackground,
};
