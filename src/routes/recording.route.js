const express = require("express");
const recordingController = require("../controllers/recording.controller");
const uploadAudio = require("../middlewares/recording.middleware");

const router = express.Router();

router.post(
  "/",
  uploadAudio.single("audio"),
  recordingController.uploadAudio
);
router.get("/", recordingController.getAllRecordings);
// APPROVE recording by ID
router.patch("/:id/approve", recordingController.approveRecording);

module.exports = router;
