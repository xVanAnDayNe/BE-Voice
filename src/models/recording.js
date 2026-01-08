const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema(
  {
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "person",
      required: true,
    },

    sentenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sentence",
      required: true,
    },

    audioUrl: {
      type: String,
      required: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "recording",
    timestamps: false,
  }
);

module.exports = mongoose.model("recording", recordingSchema);
