const sentenceService = require("../services/sentence.service");

exports.createSentence = async (req, res) => {
  try {
    const { content } = req.body;
    const adminId = req.user?.id ;

    const sentence = await sentenceService.createSentence(content, adminId);

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


exports.getAll = async (req, res) => {
    const sentences = await sentenceService.getSentences();
    res.json(sentences);
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
