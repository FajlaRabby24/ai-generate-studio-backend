import { InferenceClient } from "@huggingface/inference";
import { envVars } from "../../config/env";

const client = new InferenceClient(envVars.HP_TOKEN);

const GenerateTextToImage = async (prompt: string) => {
  const image = await client.textToImage({
    provider: "nscale",
    model: "black-forest-labs/FLUX.1-schnell",
    inputs: prompt,
    parameters: { num_inference_steps: 5 },
  });

  const blob = image;
  return blob;
};

export const TextToImageService = {
  GenerateTextToImage,
};
