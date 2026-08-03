import { GoogleGenAI } from "@google/genai";
import {
  GenerationStatus,
  GenerationType,
} from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import CloudinaryAudioUpload from "../../utils/cloudinary/audioUpload";

const client = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });

const singleVoiceTTSService = async (
  userId: string,
  voice: string,
  prompt: string,
  field: string
) => {
  const interaction = await client.interactions.create({
    model: "gemini-3.1-flash-tts-preview",
    input: prompt,
    response_format: { type: "audio" },
    generation_config: {
      speech_config: [{ voice }],
    },
  });
  if (!interaction.output_audio?.data) {
    throw new Error("No audio data generated");
  }

  // Upload to Cloudinary
  const uploadResponse = await CloudinaryAudioUpload(interaction.output_audio.data);
  if (!uploadResponse.success || !uploadResponse.secureUrl) {
    throw new Error("Failed to upload text-to-speech result to Cloudinary");
  }

  // Perform database log creation and credit limit decrement in the background
  setImmediate(() => {
    (async () => {
      try {
        // Generate history item
        await prisma.generation.create({
          data: {
            outputUrls: uploadResponse.secureUrl,
            type: GenerationType.TEXT_TO_SPEECH,
            prompt,
            userId,
            status: GenerationStatus.COMPLETED,
          },
        });

        // Decrement user credit limit
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            textToSpeechLastRefreshAT: new Date(),
            [field]: {
              decrement: 1,
            },
          },
        });
      } catch (dbError) {
        console.error("[Background DB Error - Text to Speech]:", dbError);
      }
    })();
  });

  return {
    audioUrl: uploadResponse.secureUrl,
  };
};

export const textToSpeechService = {
  singleVoiceTTSService,
};
