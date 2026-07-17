import cloudinary from "../../config/cloudinary.config";

const CloudinaryVideoUpload = async (video: string) => {
  if (!video) {
    return {
      success: false,
      message: "Video is required",
    };
  }

  const uploadResponse = await cloudinary.uploader.upload(video, {
    folder: "AI Generate Studio/Video History",
    resource_type: "video",
  });

  return {
    success: true,
    message: "Video uploaded successfully",
    format: uploadResponse.format,
    resourceType: uploadResponse.resource_type,
    publicId: uploadResponse.public_id,
    secureUrl: uploadResponse.secure_url,
    createdAt: uploadResponse.created_at,
  };
};

export default CloudinaryVideoUpload;
