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

  // Perform Cloudinary upload and database updates in the background
  setImmediate(() => {
    (async () => {
      try {
        const uploadImage = await CloudinaryImageUpload(base64Image);
        if (!uploadImage.success || !uploadImage.secureUrl) {
          throw new Error(
            "Failed to upload text-to-image result to Cloudinary",
          );
        }

        // generate history
        await prisma.generation.create({
          data: {
            outputUrls: uploadImage.secureUrl,
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
        console.error("[Background DB Error - Text to Image]:", dbError);
      }
    })();
  });

  // Return base64 string immediately
  return base64Image;
};

export const TextToImageService = {
  GenerateTextToImage,
};
