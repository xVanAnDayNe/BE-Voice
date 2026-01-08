const mongoose = require('mongoose');

const sentenceSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true
    }
  },
  {
    collection: 'sentence',
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: false
    }
  }
);

module.exports = mongoose.model('sentence', sentenceSchema);
