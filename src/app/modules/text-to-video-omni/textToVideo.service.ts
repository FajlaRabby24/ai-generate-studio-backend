import { GoogleGenAI } from "@google/genai";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import CloudinaryVideoUpload from "../../utils/cloudinary/videoUpload";

const client = new GoogleGenAI({});

const textToVideoOmni = async (
  userId: string,
  prompt: string,
  ratio: string,
  field: string,
) => {
  const interaction = await client.interactions.create({
    model: "gemini-omni-flash-preview",
    input: prompt,
    response_format: {
      type: "video", // optional
      aspect_ratio: ratio, // Supported values: '9:16', '16:9'
    },
  });

  if (!interaction.output_video?.data) {
    throw new Error("No video data found");
  }

  const base64Video = `data:video/mp4;base64,${interaction.output_video.data}`;
  // // console.log("base 64 video", base64Video);
  const uploadVideo = await CloudinaryVideoUpload(base64Video);

  if (!uploadVideo.success || !uploadVideo.secureUrl) {
    throw new Error("Failed to upload video to Cloudinary");
  }

  // Perform database logging and limit decrement in the background
  setImmediate(() => {
    (async () => {
      try {
        // Create history log
        const generated = await prisma.generated.create({
          data: {
            userId,
            type: GenerationType.TEXT_TO_VIDEO,
          },
        });

        await prisma.textToVideo.create({
          data: {
            generatedId: generated.id,
            status: GenerationStatus.COMPLETED,
            prompt,
            requestId: "sync-omni",
            outputUrl: uploadVideo.secureUrl,
          },
        });

        // Decrement user credit limit
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            textToVideoLastRefreshAT: new Date(),
            [field]: {
              decrement: 1,
            },
          },
        });
      } catch (dbError) {
        // console.error("[Background DB Error - Text to Video Omni]:", dbError);
      }
    })();
  });

  return {
    videoUrl: uploadVideo.secureUrl,
  };
};

export const textToVideoOmniService = {
  textToVideoOmni,
};
