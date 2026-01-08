const Sentence = require("../models/sentence");

// CREATE
exports.createSentence = async (data) => {
  return await Sentence.create({
    content: data.content
  });
};

// GET ALL

exports.getSentence = async () => {
  return await Sentence.find()
    .select("content createdAt");
};

//  UPDATE
exports.updateSentence = async (id, data) => {
  return await Sentence.findByIdAndUpdate(
    id,
    { content: data.content },
    { new: true }
  );
};