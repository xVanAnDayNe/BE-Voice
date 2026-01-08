const sentenceRepo = require("../repositories/sentence.repository");
const {mapSentence } = require("../utils/sentence.mapper");

exports.createSentence = async (content, adminId = null) => {
    if (!content) {
        throw new Error("Content is required");
    }

    return await sentenceRepo.createSentence({
        content,
        createdBy: adminId
    });
};


exports.getSentences = async () => {
    const rows = await sentenceRepo.getSentence();
    return rows.map(mapSentence);
};


// UPDATE
exports.updateSentence = async (id, data) => {
  if (!data.content || data.content.trim() === "") {
    throw new Error("Content không được rỗng");
  }

  const sentence = await sentenceRepo.updateSentence(id, data);

  if (!sentence) {
    throw new Error("Sentence không tồn tại");
  }

  return sentence;
};