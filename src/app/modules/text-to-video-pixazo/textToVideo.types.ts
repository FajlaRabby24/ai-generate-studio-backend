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

export interface IWebhookResponse {
  project: string;
  status: "done" | "error";
  url: string;
  duration: number;
  size: number;
  "client-data": {
    listing_id: string;
    property_address: string;
    agent_id: string;
  };
}
