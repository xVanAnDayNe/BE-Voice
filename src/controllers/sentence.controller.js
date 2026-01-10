const sentenceService = require("../services/sentence.service");

exports.createSentence = async (req, res) => {
  try {
    const { content } = req.body;

    const sentence = await sentenceService.createSentence(content);

    res.status(201).json({
      message: "Sentence created successfully",
      data: sentence
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

exports.createUserSentence = async (req, res) => {
  try {
    const { content } = req.body;

    const sentences = await sentenceService.createUserSentence(content);

    res.status(201).json({
      message: "User sentences created successfully",
      data: sentences
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

exports.approveSentence = async (req, res) => {
  try {
    const { id } = req.params;

    const sentence = await sentenceService.approveSentence(id);

    res.json({
      message: "Sentence approved successfully",
      data: sentence
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

exports.rejectSentence = async (req, res) => {
  try {
    const { id } = req.params;

    const sentence = await sentenceService.rejectSentence(id);

    res.json({
      message: "Sentence rejected successfully",
      rejectedSentence: {
        id: sentence._id,
        content: sentence.content,
        status: sentence.status
      }
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

exports.getSentencesByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const sentences = await sentenceService.getSentencesByStatus(status);

    res.json({
      status: Number(status),
      count: sentences.length,
      data: sentences
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};


exports.getAll = async (req, res) => {
  try {
    const sentences = await sentenceService.getSentences();
    res.json(sentences);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateSentence = async (req, res) => {
  try {
    const result = await sentenceService.updateSentence(
      req.params.id,
      req.body
    );
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
