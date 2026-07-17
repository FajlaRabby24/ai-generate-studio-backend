import { InferenceClient } from "@huggingface/inference";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import CloudinaryImageUpload from "../../utils/cloudinary/ImageUpload";

const client = new InferenceClient(envVars.HP_TOKEN);

const GenerateTextToImage = async (userId: string, prompt: string) => {
  const image = await client.textToImage({
    provider: "nscale",
    model: "black-forest-labs/FLUX.1-schnell",
    inputs: prompt,
    parameters: { num_inference_steps: 5 },
  });

  const blob = image;

  const arrayBuffer = await (blob as any).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;

  const uploadImage = await CloudinaryImageUpload(base64Image);

  if (!uploadImage.success) {
    throw new Error("Failed to upload image");
  }

  setImmediate(() => {
    (async () => {
      try {
        // generate history
        await prisma.generation.create({
          data: {
            outputUrls: uploadImage.secureUrl!,
            type: GenerationType.TEXT_TO_IMAGE,
            prompt,
            userId,
            status: GenerationStatus.COMPLETED,
          },
        });

        // decrement limit
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            textToImage: {
              decrement: 1,
            },
          },
        });
      } catch (dbError) {
        console.error("[Background DB Error]:", dbError);
      }
    })();
  });

  return uploadImage.secureUrl;
};

export const TextToImageService = {
  GenerateTextToImage,
};
