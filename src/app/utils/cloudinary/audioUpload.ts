import cloudinary from "../../config/cloudinary.config";

const CloudinaryAudioUpload = async (audio: string | Buffer) => {
  if (!audio) {
    return {
      success: false,
      message: "Audio data is required",
      secureUrl: null,
    };
  }

  try {
    let uploadResponse;

    // 1. If audio is a Buffer (Stream Upload)
    if (Buffer.isBuffer(audio)) {
      uploadResponse = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "AI Generate Studio/Audio History",
            resource_type: "video", // Cloudinary processes audio files under resource_type 'video'
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );
        uploadStream.end(audio);
      });
    }
    // 2. If audio is Base64 String or URL
    else {
      uploadResponse = await cloudinary.uploader.upload(audio, {
        folder: "AI Generate Studio/Audio History",
        resource_type: "video",
      });
    }

    return {
      success: true,
      message: "Audio uploaded successfully",
      format: uploadResponse.format,
      resourceType: uploadResponse.resource_type,
      publicId: uploadResponse.public_id,
      secureUrl: uploadResponse.secure_url,
      createdAt: uploadResponse.created_at,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to upload audio to Cloudinary",
      secureUrl: null,
    };
  }
};

export default CloudinaryAudioUpload;
