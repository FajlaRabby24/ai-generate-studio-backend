import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const textToImage = async (prompt: string) => {
  const client = new GoogleGenAI({});

  const interaction = await client.interactions.create({
    model: "gemini-3.1-flash-image",
    input: prompt,
  });

  const generatedImage = interaction.output_image;
  if (generatedImage && generatedImage.data) {
    const buffer = Buffer.from(generatedImage.data, "base64");
    fs.writeFileSync("gemini-native-image.png", buffer);
    console.log("Image saved as gemini-native-image.png");
  }
};

export const generateService = {
  textToImage,
};
