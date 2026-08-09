import { GoogleGenAI } from "@google/genai";
import { Communicate } from "edge-tts-universal";
import fs from "fs/promises";
import path from "path";
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
  field: string,
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
  const uploadResponse = await CloudinaryAudioUpload(
    interaction.output_audio.data,
  );
  if (!uploadResponse.success || !uploadResponse.secureUrl) {
    throw new Error("Failed to upload text-to-speech result to Cloudinary");
  }

  // Perform database log creation and credit limit decrement in the background
  setImmediate(() => {
    (async () => {
      try {
        await prisma.$transaction(async (tx) => {
          const generated = await tx.generated.create({
            data: {
              userId,
              type: GenerationType.TEXT_TO_SPEECH,
            },
          });

          await tx.textToSpeech.create({
            data: {
              generatedId: generated.id,
              status: GenerationStatus.COMPLETED,
              prompt,
              voiceId: voice,
              audioUrl: uploadResponse.secureUrl!,
            },
          });

          // Decrement user credit limit
          await tx.user.update({
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

// * text speech generate
const textToSpeech = async (
  userId: string,
  prompt: string,
  voiceId: string,
  rate?: string,
  pitch?: string,
) => {
  const communicate = new Communicate(prompt, {
    voice: voiceId,
    rate,
    pitch,
  });

  const buffers: Buffer[] = [];
  for await (const chunk of communicate.stream()) {
    if (chunk.type === "audio" && chunk.data) {
      buffers.push(chunk.data);
    }
  }

  if (buffers.length === 0) {
    throw new Error("No audio data generated");
  }

  const audioBuffer = Buffer.concat(buffers);

  // Upload to Cloudinary
  const uploadResponse = await CloudinaryAudioUpload(audioBuffer);
  if (!uploadResponse.success || !uploadResponse.secureUrl) {
    throw new Error("Failed to upload text-to-speech result to Cloudinary");
  }

  // Perform database log creation and credit limit decrement in the background
  setImmediate(() => {
    (async () => {
      try {
        await prisma.$transaction(async (tx) => {
          const generated = await tx.generated.create({
            data: {
              userId,
              type: GenerationType.TEXT_TO_SPEECH,
            },
          });

          await tx.textToSpeech.create({
            data: {
              generatedId: generated.id,
              status: GenerationStatus.COMPLETED,
              prompt,
              voiceId: voiceId,
              audioUrl: uploadResponse.secureUrl!,
            },
          });

          // Decrement user credit limit
          await tx.user.update({
            where: {
              id: userId,
            },
            data: {
              textToSpeechLastRefreshAT: new Date(),
              textToSpeech: {
                decrement: 1,
              },
            },
          });
        });
      } catch (dbError) {
        throw new Error(`[Background DB Error - Text to Speech]:${dbError}`);
      }
    })();
  });

  return {
    audioUrl: uploadResponse.secureUrl,
  };
};

// get voices
const getVoices = async (lang: string, gender: string) => {
  const filePath = path.join(
    process.cwd(),
    "src",
    "app",
    "modules",
    "text-to-speech",
    "voices.json",
  );
  const data = await fs.readFile(filePath, "utf-8");
  const voices = JSON.parse(data) as Array<{
    id: string;
    name: string;
    gender: string;
    language: string;
  }>;

  return voices.filter((voice) => {
    const matchLang = lang
      ? voice.language.toLowerCase().includes(lang.toLowerCase()) ||
        voice.id.toLowerCase().includes(lang.toLowerCase())
      : true;

    const matchGender = gender
      ? voice.gender.toLowerCase() === gender.toLowerCase()
      : true;

    return matchLang && matchGender;
  });
};

const getRecentGeneration = async (userId: string) => {
  const generations = await prisma.generated.findMany({
    where: {
      userId,
      type: GenerationType.TEXT_TO_SPEECH,
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    include: {
      textToSpeeches: true,
    },
  });

  return generations;
};

const deleteTextToSpeech = async (userId: string, id: string) => {
  const result = await prisma.generated.update({
    where: {
      id,
      userId,
    },
    data: {
      isDeleted: true,
    },
  });

  return result;
};

export const textToSpeechService = {
  singleVoiceTTSService,
  textToSpeech,
  getVoices,
  getRecentGeneration,
  deleteTextToSpeech,
};
