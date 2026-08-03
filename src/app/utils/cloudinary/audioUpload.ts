import cloudinary from "../../config/cloudinary.config";

const CloudinaryAudioUpload = async (audioBase64: string) => {
  if (!audioBase64) {
    return {
      success: false,
      message: "Audio data is required",
    };
  }

  // Cloudinary expects base64 files to have data URI prefix or we can upload via raw base64 string
  const uploadResponse = await cloudinary.uploader.upload(audioBase64, {
    folder: "AI Generate Studio/Audio History",
    resource_type: "video", // Cloudinary processes audio files under resource_type 'video'
  });

  return {
    success: true,
    message: "Audio uploaded successfully",
    format: uploadResponse.format,
    resourceType: uploadResponse.resource_type,
    publicId: uploadResponse.public_id,
    secureUrl: uploadResponse.secure_url,
    createdAt: uploadResponse.created_at,
  };
};

export default CloudinaryAudioUpload;
