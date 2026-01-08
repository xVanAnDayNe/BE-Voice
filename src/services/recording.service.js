const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const uploadWavAudio = async (file) => {
  if (!file || !file.path) {
    throw new Error("Không có dữ liệu audio");
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "video",
      folder: "lesson_audio",
      format: "wav",
      use_filename: true,
      unique_filename: true,
    });
    return {
      audioUrl: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  uploadWavAudio,
};
