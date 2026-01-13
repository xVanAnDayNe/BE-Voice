const Sentence = require("../models/sentence");
const {mapSentence } = require("../utils/sentence.mapper");
const Recording = require("../models/recording");

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
exports.createUserSentence = async (content, userName) => {
    if (!content) {
        throw new Error("Content is required");
    }

    const sentences = content
        .split(/[.!?]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const data = sentences.map(text => ({
        content: text,
        status: 0,
        createdBy: userName || null
    }));

    return await Sentence.insertMany(data);
};

// Download sentences for different modes:
// mode = 'all' -> all sentences (0,1,2,3) with recordings if any
// mode = 'with-audio' -> sentences that have recordings with isApproved IN (0,1)
// mode = 'approved' -> sentences that have recording.isApproved = 1 AND sentence.status = 2
exports.downloadSentences = async (mode = "all") => {
  mode = mode || "all";

  if (mode === "all") {
    const sentences = await Sentence.find()
      .select("content createdAt status createdBy")
      .sort({ createdAt: -1 });

    const sentenceIds = sentences.map(s => s._id);
    const recordings = await Recording.find({ sentenceId: { $in: sentenceIds } })
      .select("audioUrl isApproved recordedAt personId sentenceId")
      .sort({ recordedAt: -1 });

    const recordingsBySentence = {};
    recordings.forEach(r => {
      const sid = r.sentenceId.toString();
      recordingsBySentence[sid] = recordingsBySentence[sid] || [];
      recordingsBySentence[sid].push({
        RecordingID: r._id,
        AudioUrl: r.audioUrl,
        IsApproved: r.isApproved,
        RecordedAt: r.recordedAt,
        PersonID: r.personId
      });
    });

    return sentences.map(s => ({
      sentence: mapSentence(s),
      recordings: recordingsBySentence[s._id.toString()] || []
    }));
  }

  if (mode === "with-audio") {
    const recordings = await Recording.find({ isApproved: { $in: [0, 1] } })
      .populate("sentenceId", "content status createdAt createdBy")
      .sort({ recordedAt: -1 });

    const mapBySentence = {};
    recordings.forEach(r => {
      if (!r.sentenceId) return;
      const sid = r.sentenceId._id.toString();
      mapBySentence[sid] = mapBySentence[sid] || {
        sentence: {
          SentenceID: r.sentenceId._id,
          Content: r.sentenceId.content,
          CreatedAt: r.sentenceId.createdAt,
          Status: r.sentenceId.status,
          CreatedBy: r.sentenceId.createdBy || null
        },
        recordings: []
      };
      mapBySentence[sid].recordings.push({
        RecordingID: r._id,
        AudioUrl: r.audioUrl,
        IsApproved: r.isApproved,
        RecordedAt: r.recordedAt,
        PersonID: r.personId
      });
    });

    return Object.values(mapBySentence);
  }

  if (mode === "approved") {
    const recordings = await Recording.find({ isApproved: 1 })
      .populate("sentenceId", "content status createdAt createdBy")
      .sort({ recordedAt: -1 });

    const mapBySentence = {};
    recordings.forEach(r => {
      if (!r.sentenceId) return;
      if (r.sentenceId.status !== 2) return; // only include sentences that are status 2
      const sid = r.sentenceId._id.toString();
      mapBySentence[sid] = mapBySentence[sid] || {
        sentence: {
          SentenceID: r.sentenceId._id,
          Content: r.sentenceId.content,
          CreatedAt: r.sentenceId.createdAt,
          Status: r.sentenceId.status,
          CreatedBy: r.sentenceId.createdBy || null
        },
        recordings: []
      };
      mapBySentence[sid].recordings.push({
        RecordingID: r._id,
        AudioUrl: r.audioUrl,
        IsApproved: r.isApproved,
        RecordedAt: r.recordedAt,
        PersonID: r.personId
      });
    });

    return Object.values(mapBySentence);
  }

  throw new Error("Unknown download mode");
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