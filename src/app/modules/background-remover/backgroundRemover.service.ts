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

  const uploadImage = await CloudinaryImageUpload(resultBuffer);
  if (!uploadImage.success || !uploadImage.secureUrl) {
    throw new Error("Failed to upload background-removed image to Cloudinary");
  }

  const secureUrl = uploadImage.secureUrl;

  setImmediate(() => {
    (async () => {
      try {
        let inputImageUrl = "";
        try {
          const inputUpload = await CloudinaryImageUpload(fileBuffer);
          if (inputUpload.success && inputUpload.secureUrl) {
            inputImageUrl = inputUpload.secureUrl;
          }
        } catch (err) {
          throw new Error(
            `Failed to upload input image reference to Cloudinary: ${err}`,
          );
        }

        await prisma.$transaction(async (tx) => {
          const generated = await tx.generated.create({
            data: {
              userId,
              type: GenerationType.IMAGE_BACKGROUND_REMOVER,
            },
          });

          await tx.backgroundRemove.create({
            data: {
              generatedId: generated.id,
              status: GenerationStatus.COMPLETED,
              imageUrl: inputImageUrl,
              outputUrls: secureUrl,
            },
          });

          await tx.user.update({
            where: { id: userId },
            data: {
              imageBackgroundRemoverLastRefreshAT: new Date(),
              imageBackgroundRemover: {
                decrement: 1,
              },
            },
          });
        });
      } catch (error) {
        throw new Error(`[Background BG Remover Job Error]: ${error}`);
      }
    })();
  });

  // Return the base64 string immediately to minimize response latency
  return { secureUrl };
};

export const BackgroundRemoverService = {
  removeBackground,
};
