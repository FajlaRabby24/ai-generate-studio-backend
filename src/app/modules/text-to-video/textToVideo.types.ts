export interface IGenerateTextToVideo {
  prompt: string;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  style?: string;
  background?: string;
}

export interface IJson2VideoProjectResponse {
  success: boolean;
  project: string;
  timestamp: string;
}
