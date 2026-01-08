const express = require("express");
const recordingController = require("../controllers/recording.controller");
const uploadAudio = require("../middlewares/recording.middleware");

const router = express.Router();

router.post(
  "/",
  uploadAudio.single("audio"),
  recordingController.uploadAudio
);

module.exports = router;
