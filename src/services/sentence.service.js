const Sentence = require("../models/sentence");
const {mapSentence } = require("../utils/sentence.mapper");

//Create sentence 
exports.createSentence = async (content) => {
    if (!content) {
        throw new Error("Content is required");
    }
    const sentences = content
        .split(/[.!?]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    const data = sentences.map(text => ({
        content: text,
        status: 1
    }));

    return await Sentence.insertMany(data);
};


//Get all sentence 
exports.getSentences = async () => {
    const rows = await Sentence.find()
      .select("content createdAt status");
    return rows.map(mapSentence);
};


//Create sentence for user (status = 0)
exports.createUserSentence = async (content) => {
    if (!content) {
        throw new Error("Content is required");
    }

    const sentences = content
        .split(/[.!?]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const data = sentences.map(text => ({
        content: text,
        status: 0
    }));

    return await Sentence.insertMany(data);
};

//Approve sentence (change status from 0 to 1)
exports.approveSentence = async (id) => {
  const sentence = await Sentence.findByIdAndUpdate(
    id,
    { status: 1 },
    { new: true }
  );

  if (!sentence) {
    throw new Error("Sentence không tồn tại");
  }

  return sentence;
};

//Reject sentence (delete sentence)
exports.rejectSentence = async (id) => {
  const sentence = await Sentence.findByIdAndUpdate(
    id,
    { status: 3 },
    { new: true }
  );

  if (!sentence) {
    throw new Error("Sentence không tồn tại");
  }

  return sentence;
};

//Get sentences by status
exports.getSentencesByStatus = async (status) => {
  const validStatuses = [0, 1, 2, 3];
  if (!validStatuses.includes(Number(status))) {
    throw new Error("Status không hợp lệ. Chỉ chấp nhận: 0, 1, 2, 3");
  }

  const rows = await Sentence.find({ status: Number(status) })
    .select("content createdAt status")
    .sort({ createdAt: -1 });

  return rows.map(mapSentence);
};

//Update sentence
exports.updateSentence = async (id, data) => {
  if (!data.content || data.content.trim() === "") {
    throw new Error("Content không được rỗng");
  }

  // Kiểm tra status của sentence trước khi update
  const existingSentence = await Sentence.findById(id);
  if (!existingSentence) {
    throw new Error("Sentence không tồn tại");
  }

  if (existingSentence.status === 2) {
    throw new Error("Sentence này đã có recording được duyệt, không thể chỉnh sửa");
  }

  const sentence = await Sentence.findByIdAndUpdate(
    id,
    { content: data.content },
    { new: true }
  );

  return sentence;
};