const cloudinary = require("cloudinary").v2;
const Recording = require("../models/recording");

exports.uploadAudio = async (req, res) => {
  try {
    const { personId, sentenceId } = req.body;
    if (!personId || !sentenceId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu personId hoặc sentenceId",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Thiếu file audio",
      });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "lesson_audio",
    });
    const recording = await Recording.create({
      personId,
      sentenceId,
      audioUrl: result.secure_url,
      isApproved: false,
      recordedAt: new Date(),
    });

    // 4️⃣ Response
    res.status(201).json({
      success: true,
      message: "Upload audio thành công",
      data: recording,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
