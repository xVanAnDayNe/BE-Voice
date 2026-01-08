const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const Recording = require("../models/recording");
const { mapRecording } = require("../utils/recording.mapper");

// upload audio
const uploadWavAudio = async (file) => {
  if (!file || !file.path) throw new Error("Không có dữ liệu audio");

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

// GET ALL 
const getAllRecordings = async () => {
  const recordings = await Recording.find().sort({ createdAt: -1 });
  return recordings.map(mapRecording);
};

// APPROVE recording (set isApproved = true)
const approveRecording = async (id) => {
  const updated = await Recording.findByIdAndUpdate(
    id,
    { isApproved: true },
    { new: true } 
  );
  if (!updated) throw new Error("Recording not found");
  return mapRecording(updated);
};

module.exports = {
  uploadWavAudio,
  getAllRecordings,
  approveRecording,
};
