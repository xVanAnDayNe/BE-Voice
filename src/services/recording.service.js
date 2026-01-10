const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const Recording = require("../models/recording");
const Sentence = require("../models/sentence");
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

// APPROVE recording (set isApproved = 1 và update sentence status = 2)
const approveRecording = async (id) => {
  // Tìm recording để lấy sentenceId
  const recording = await Recording.findById(id);
  if (!recording) throw new Error("Recording not found");

  // Kiểm tra xem sentence đã có status = 2 chưa
  const sentence = await Sentence.findById(recording.sentenceId);
  if (!sentence) throw new Error("Sentence not found");

  if (sentence.status === 2) {
    // Set recording status = 3 (không thể duyệt vì sentence đã có recording)
    await Recording.findByIdAndUpdate(id, { isApproved: 3 });
    throw new Error("Sentence này đã có recording được duyệt, không thể duyệt thêm recording khác");
  }

  // Update recording isApproved = 1
  const updatedRecording = await Recording.findByIdAndUpdate(
    id,
    { isApproved: 1 },
    { new: true }
  );

  // Update sentence status = 2
  await Sentence.findByIdAndUpdate(
    recording.sentenceId,
    { status: 2 }
  );

  return mapRecording(updatedRecording);
};

// REJECT recording (set isApproved = 2)
const rejectRecording = async (id) => {
  const updated = await Recording.findByIdAndUpdate(
    id,
    { isApproved: 2 },
    { new: true }
  );
  if (!updated) throw new Error("Recording not found");
  return mapRecording(updated);
};

// Get recordings by isApproved status
const getRecordingsByStatus = async (status) => {
  const validStatuses = [0, 1, 2, 3];
  if (!validStatuses.includes(Number(status))) {
    throw new Error("Status không hợp lệ. Chỉ chấp nhận: 0, 1, 2, 3");
  }

  const recordings = await Recording.find({ isApproved: Number(status) })
    .sort({ createdAt: -1 });

  return recordings.map(mapRecording);
};

module.exports = {
  uploadWavAudio,
  getAllRecordings,
  approveRecording,
  rejectRecording,
  getRecordingsByStatus,
};
